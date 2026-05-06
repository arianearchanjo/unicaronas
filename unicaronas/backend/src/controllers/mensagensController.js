// backend/src/controllers/mensagensController.js
const db = require('../../config/database');
const notificacoesService = require('../services/notificacoesService');

// POST /api/mensagens — Enviar mensagem
const enviar = async (req, res, next) => {
  try {
    const { solicitacao_id, destinatario_id, conteudo, tipo_conversa, contexto_id } = req.body;
    const remetente_id = req.usuario.id;
    
    let dest_id = destinatario_id;
    let tipo = tipo_conversa || 'geral';
    let ctx_id = contexto_id || null;
    let sol_id = solicitacao_id || null;

    // Lógica legada: se vier solicitacao_id, descobre o destinatário e contexto
    if (sol_id) {
      const solicitacao = await db.query(
        `SELECT s.passageiro_id, c.motorista_id, c.id AS carona_id
         FROM solicitacoes_carona s
         JOIN caronas c ON c.id = s.carona_id
         WHERE s.id = $1`,
        [sol_id]
      );

      if (solicitacao.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Conversa (solicitação) não encontrada' });
      }

      const { passageiro_id, motorista_id, carona_id } = solicitacao.rows[0];
      if (remetente_id !== passageiro_id && remetente_id !== motorista_id) {
        return res.status(403).json({ success: false, error: 'Não autorizado' });
      }

      dest_id = remetente_id === passageiro_id ? motorista_id : passageiro_id;
      tipo = tipo_conversa || 'carona';
      ctx_id = contexto_id || carona_id;
    }

    if (!dest_id) {
      return res.status(400).json({ success: false, error: 'Destinatário não informado' });
    }

    const resultado = await db.query(
      `INSERT INTO mensagens_chat (solicitacao_id, remetente_id, destinatario_id, conteudo, tipo_conversa, contexto_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [sol_id, remetente_id, dest_id, conteudo, tipo, ctx_id]
    );

    // Notificar o destinatário
    await notificacoesService.criarNotificacao({
      usuario_id: dest_id,
      carona_id: ctx_id,
      conteudo: `Você recebeu uma nova mensagem.`,
      tipo: 'mensagem'
    });

    res.status(201).json({ success: true, data: resultado.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/mensagens/:id — Histórico do chat
// :id pode ser um solicitacao_id (legado) ou um destinatario_id (novo formato)
const listar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSolicitacao = req.query.is_user !== 'true'; // Se não especificar, assume que é solicitacao_id por compatibilidade
    const usuario_id = req.usuario.id;
    let outro_usuario_id = null;

    if (isSolicitacao) {
      const solicitacao = await db.query(
        `SELECT s.passageiro_id, c.motorista_id
         FROM solicitacoes_carona s
         JOIN caronas c ON c.id = s.carona_id
         WHERE s.id = $1`,
        [id]
      );

      if (solicitacao.rows.length > 0) {
        const { passageiro_id, motorista_id } = solicitacao.rows[0];
        if (usuario_id === passageiro_id) {
          outro_usuario_id = motorista_id;
        } else if (usuario_id === motorista_id) {
          outro_usuario_id = passageiro_id;
        } else {
          return res.status(403).json({ success: false, error: 'Não autorizado' });
        }
      }
    }

    if (!outro_usuario_id) {
      // Tentar usar o id passado diretamente como usuario (para inbox geral)
      outro_usuario_id = parseInt(id, 10);
    }

    if (isNaN(outro_usuario_id) || outro_usuario_id <= 0) {
      return res.status(400).json({ success: false, error: 'ID de conversa inválido' });
    }

    const mensagens = await db.query(
      `SELECT m.*, u.nome AS remetente_nome, u.foto_url AS remetente_foto
       FROM mensagens_chat m
       JOIN usuarios u ON u.id = m.remetente_id
       WHERE (m.remetente_id = $1 AND m.destinatario_id = $2)
          OR (m.remetente_id = $2 AND m.destinatario_id = $1)
       ORDER BY m.enviado_em ASC`,
      [usuario_id, outro_usuario_id]
    );

    // Marcar como lidas
    await db.query(
      `UPDATE mensagens_chat SET lida = true
       WHERE destinatario_id = $1 AND remetente_id = $2 AND lida = false`,
      [usuario_id, outro_usuario_id]
    );

    res.json({ success: true, data: mensagens.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/mensagens/conversas/lista
// Lista inbox de conversas do usuario logado
const listarConversas = async (req, res, next) => {
  try {
    const usuario_id = req.usuario.id;
    const { rows } = await db.query(
      `WITH UltimasMensagens AS (
         SELECT 
           CASE 
             WHEN remetente_id = $1 THEN destinatario_id 
             ELSE remetente_id 
           END AS outro_usuario_id,
           MAX(enviado_em) AS ultima_hora
         FROM mensagens_chat
         WHERE remetente_id = $1 OR destinatario_id = $1
         GROUP BY 1
       )
       SELECT 
         u.id AS outro_usuario_id,
         u.nome AS outro_usuario_nome,
         u.foto_url AS outro_usuario_foto,
         u.curso AS outro_usuario_curso,
         m.conteudo AS ultima_mensagem,
         m.enviado_em AS timestamp,
         (SELECT COUNT(*) FROM mensagens_chat mc WHERE mc.remetente_id = u.id AND mc.destinatario_id = $1 AND mc.lida = false) AS nao_lidas,
         m.solicitacao_id
       FROM UltimasMensagens um
       JOIN usuarios u ON u.id = um.outro_usuario_id
       JOIN mensagens_chat m ON (m.remetente_id = $1 AND m.destinatario_id = um.outro_usuario_id AND m.enviado_em = um.ultima_hora) 
                             OR (m.remetente_id = um.outro_usuario_id AND m.destinatario_id = $1 AND m.enviado_em = um.ultima_hora)
       ORDER BY m.enviado_em DESC`,
      [usuario_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const contagemNaoLidas = async (req, res, next) => {
  try {
    const usuario_id = req.usuario.id;
    const { rows } = await db.query(
      `SELECT COUNT(*)::int as total 
       FROM mensagens_chat m
       WHERE m.destinatario_id = $1 AND m.lida = false`,
      [usuario_id]
    );
    res.json({ success: true, count: rows[0].total });
  } catch (err) {
    next(err);
  }
};

module.exports = { enviar, listar, contagemNaoLidas, listarConversas };

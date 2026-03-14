const db = require('../../config/database');

/**
 * POST /api/avaliacoes
 * Avalia um participante de uma carona concluída.
 */
const avaliar = async (req, res, next) => {
  try {
    const { solicitacao_id, avaliado_id, nota, comentario } = req.body;
    const avaliador_id = req.usuario.id;

    const solId  = parseInt(solicitacao_id, 10);
    const avalId = parseInt(avaliado_id, 10);
    const notaNum = parseInt(nota, 10);

    if (isNaN(solId)  || solId  <= 0) return res.status(400).json({ success: false, error: 'solicitacao_id inválido' });
    if (isNaN(avalId) || avalId <= 0) return res.status(400).json({ success: false, error: 'avaliado_id inválido' });
    if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
      return res.status(400).json({ success: false, error: 'A nota deve ser um inteiro entre 1 e 5' });
    }

    if (avalId === avaliador_id) {
      return res.status(400).json({ success: false, error: 'Você não pode se auto-avaliar' });
    }

    // Verifica se a solicitação existe e está aceita
    const { rows: solicitacoes } = await db.query(
      `SELECT s.passageiro_id, c.motorista_id
       FROM solicitacoes_carona s
       JOIN caronas c ON c.id = s.carona_id
       WHERE s.id = $1 AND s.status = 'aceita'`,
      [solId]
    );

    if (solicitacoes.length === 0) {
      return res.status(404).json({ success: false, error: 'Solicitação não encontrada ou ainda não aceita' });
    }

    const { passageiro_id, motorista_id } = solicitacoes[0];

    // Verifica se o avaliador participa da carona
    if (avaliador_id !== passageiro_id && avaliador_id !== motorista_id) {
      return res.status(403).json({ success: false, error: 'Você não participa desta carona' });
    }

    // Verifica se o avaliado participa da carona
    if (avalId !== passageiro_id && avalId !== motorista_id) {
      return res.status(400).json({ success: false, error: 'O usuário avaliado não participa desta carona' });
    }

    const { rows } = await db.query(
      `INSERT INTO avaliacoes (solicitacao_id, avaliador_id, avaliado_id, nota, comentario)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [solId, avaliador_id, avalId, notaNum, comentario?.trim() || null]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Você já avaliou esta carona' });
    }
    next(err);
  }
};

/**
 * GET /api/avaliacoes/:usuario_id
 * Lista avaliações recebidas por um usuário.
 */
const listarPorUsuario = async (req, res, next) => {
  try {
    const usuario_id = parseInt(req.params.usuario_id, 10);
    if (isNaN(usuario_id) || usuario_id <= 0) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const { rows } = await db.query(
      `SELECT
         a.id,
         a.nota,
         a.comentario,
         a.criado_em,
         u.id   AS avaliador_id,
         u.nome AS avaliador_nome,
         u.foto_url AS avaliador_foto,
         c.origem,
         c.destino,
         c.horario_partida
       FROM avaliacoes a
       JOIN usuarios u             ON u.id = a.avaliador_id
       JOIN solicitacoes_carona s  ON s.id = a.solicitacao_id
       JOIN caronas c              ON c.id = s.carona_id
       WHERE a.avaliado_id = $1
       ORDER BY a.criado_em DESC`,
      [usuario_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { avaliar, listarPorUsuario };
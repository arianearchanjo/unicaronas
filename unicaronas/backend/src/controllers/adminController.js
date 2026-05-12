const db     = require('../../config/database');

const BCRYPT_ROUNDS = 12;

/**
 * GET /api/admin/usuarios/pendentes
 * Lista usuários que enviaram documentos e estão com status 'pendente'
 */
const listarPendentes = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, nome, email, matricula, curso, perfil_tipo, cnh_url, identidade_url, status_verificacao, criado_em
       FROM usuarios
       WHERE status_verificacao = 'pendente' AND (cnh_url IS NOT NULL OR identidade_url IS NOT NULL)
       ORDER BY criado_em ASC`
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/usuarios/:id/verificar
 * Aprova ou rejeita documentos de um usuário
 */
const verificarDocumento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'aprovado' ou 'rejeitado'

    if (!['aprovado', 'rejeitado'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status inválido. Use "aprovado" ou "rejeitado".' });
    }

    const { rows } = await db.query(
      `UPDATE usuarios
       SET status_verificacao = $1, atualizado_em = NOW()
       WHERE id = $2
       RETURNING id, nome, email, status_verificacao`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    // TODO: Enviar notificação para o usuário informando sobre a decisão

    res.json({ 
      success: true, 
      data: {
        ...rows[0],
        message: `Documentos ${status === 'aprovado' ? 'aprovados' : 'rejeitados'} com sucesso.`
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/erros
 * Usuário reporta um erro (pode ser logado ou não, mas aqui usaremos logado)
 */
const reportarErro = async (req, res, next) => {
  try {
    const { descricao } = req.body;
    const usuario_id = req.usuario ? req.usuario.id : null;

    if (!descricao) {
      return res.status(400).json({ success: false, error: 'Descrição é obrigatória' });
    }

    await db.query(
      'INSERT INTO relatorios_erro (usuario_id, descricao) VALUES ($1, $2)',
      [usuario_id, descricao]
    );

    res.status(201).json({ success: true, message: 'Relatório enviado com sucesso. Obrigado!' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/erros
 * Admin lista todos os erros reportados
 */
const listarErros = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*, u.nome as usuario_nome, u.email as usuario_email 
       FROM relatorios_erro e
       LEFT JOIN usuarios u ON e.usuario_id = u.id
       ORDER BY e.criado_em DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/erros/:id
 * Admin atualiza status do erro
 */
const atualizarStatusErro = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query(
      'UPDATE relatorios_erro SET status = $1 WHERE id = $2',
      [status, id]
    );

    res.json({ success: true, message: 'Status do erro atualizado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listarPendentes, verificarDocumento, reportarErro, listarErros, atualizarStatusErro };

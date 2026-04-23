const pool = require('../../config/database');

/**
 * Cria uma notificação in-app para um usuário.
 * @param {number} usuario_id ID do usuário destinatário
 * @param {string} mensagem Conteúdo da notificação
 * @param {string} link (Opcional) URL para redirecionamento
 */
async function criarNotificacao(usuario_id, mensagem, link = null) {
  try {
    const query = 'INSERT INTO notificacoes (usuario_id, mensagem, link) VALUES ($1, $2, $3)';
    await pool.query(query, [usuario_id, mensagem, link]);
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
  }
}

module.exports = { criarNotificacao };

const pool = require('../../config/database');

const notificacoesService = {
  /**
   * Cria uma nova notificação no banco de dados
   */
  async criarNotificacao({ usuario_id, titulo, mensagem, tipo, referencia_id = null, referencia_tipo = null }) {
    try {
      const query = `
        INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo, referencia_id, referencia_tipo)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [usuario_id, titulo, mensagem, tipo, referencia_id, referencia_tipo];
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      console.error('Erro ao criar notificação:', err);
      throw err;
    }
  },

  /**
   * Lista notificações de um usuário
   */
  async listarPorUsuario(usuario_id, limite = 50) {
    try {
      const query = `
        SELECT * FROM notificacoes
        WHERE usuario_id = $1
        ORDER BY criado_em DESC
        LIMIT $2;
      `;
      const { rows } = await pool.query(query, [usuario_id, limite]);
      return rows;
    } catch (err) {
      console.error('Erro ao listar notificações:', err);
      throw err;
    }
  },

  /**
   * Marca uma notificação como lida
   */
  async marcarComoLida(id, usuario_id) {
    try {
      const query = `
        UPDATE notificacoes
        SET lida = true
        WHERE id = $1 AND usuario_id = $2
        RETURNING *;
      `;
      const { rows } = await pool.query(query, [id, usuario_id]);
      return rows[0];
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      throw err;
    }
  },

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  async marcarTodasComoLidas(usuario_id) {
    try {
      const query = `
        UPDATE notificacoes
        SET lida = true
        WHERE usuario_id = $1 AND lida = false
        RETURNING *;
      `;
      const { rows } = await pool.query(query, [usuario_id]);
      return rows;
    } catch (err) {
      console.error('Erro ao marcar todas as notificações como lidas:', err);
      throw err;
    }
  }
};

module.exports = notificacoesService;

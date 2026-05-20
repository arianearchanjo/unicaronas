const logger = require('../utils/logger');
const pool = require('../../config/database');

const notificacoesService = {
  /**
   * Cria uma nova notificação no banco de dados
   */
  async criarNotificacao({ usuario_id, carona_id = null, tipo, conteudo }) {
    try {
      const query = `
        INSERT INTO notificacoes (usuario_id, carona_id, tipo, conteudo)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const values = [usuario_id, carona_id, tipo, conteudo];
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      logger.error('Erro ao criar notificação:', err);
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
      logger.error('Erro ao listar notificações:', err);
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
      logger.error('Erro ao marcar notificação como lida:', err);
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
      logger.error('Erro ao marcar todas as notificações como lidas:', err);
      throw err;
    }
  }
};

module.exports = notificacoesService;

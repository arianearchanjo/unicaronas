const pool = require('../../config/database');

const notificacoesController = {
  /**
   * GET /api/notificacoes
   * Lista notificações do usuário logado
   */
  async listar(req, res) {
    const usuario_id = req.usuario.id;

    try {
      const query = `
        SELECT * FROM notificacoes
        WHERE usuario_id = $1
        ORDER BY criado_em DESC
        LIMIT 50;
      `;
      const result = await pool.query(query, [usuario_id]);

      return res.json({
        success: true,
        dados: result.rows
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Erro ao listar notificações.' });
    }
  },

  /**
   * PATCH /api/notificacoes/:id/lida
   * Marca uma notificação como lida
   */
  async marcarComoLida(req, res) {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    try {
      const query = `
        UPDATE notificacoes
        SET lida = true
        WHERE id = $1 AND usuario_id = $2
        RETURNING *;
      `;
      const result = await pool.query(query, [id, usuario_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Notificação não encontrada.' });
      }

      return res.json({
        success: true,
        dados: result.rows[0]
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Erro ao atualizar notificação.' });
    }
  }
};

module.exports = notificacoesController;

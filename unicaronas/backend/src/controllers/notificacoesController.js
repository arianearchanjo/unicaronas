const notificacoesService = require('../services/notificacoesService');

const notificacoesController = {
  /**
   * GET /api/notificacoes
   */
  async listar(req, res, next) {
    try {
      const usuario_id = req.usuario.id;
      const notificacoes = await notificacoesService.listarPorUsuario(usuario_id);
      
      return res.json({
        success: true,
        data: notificacoes
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/notificacoes/:id
   */
  async marcarLida(req, res, next) {
    try {
      const { id } = req.params;
      const usuario_id = req.usuario.id;

      const notificacao = await notificacoesService.marcarComoLida(id, usuario_id);

      if (!notificacao) {
        return res.status(404).json({ success: false, error: 'Notificação não encontrada.' });
      }

      return res.json({
        success: true,
        data: notificacao
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/notificacoes/todas
   */
  async marcarTodasLidas(req, res, next) {
    try {
      const usuario_id = req.usuario.id;
      const notificacoes = await notificacoesService.marcarTodasComoLidas(usuario_id);

      return res.json({
        success: true,
        data: {
          notificacoes,
          message: `${notificacoes.length} notificações marcadas como lidas.`
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = notificacoesController;

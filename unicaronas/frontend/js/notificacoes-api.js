// frontend/js/notificacoes-api.js

export const NotificacoesAPI = {
  /**
   * Busca todas as notificações do usuário logado.
   */
  async listar() {
    try {
      const res = await api.listarNotificacoes();
      return res.data || [];
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      return [];
    }
  },

  /**
   * Marca todas as notificações como lidas.
   */
  async marcarComoLidas() {
    try {
      await api.marcarTodasNotif();
    } catch (err) {
      console.error('Erro ao marcar notificações como lidas:', err);
    }
  }
};

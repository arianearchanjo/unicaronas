/**
 * UniCaronas — chat-state.js
 * Gerenciamento de estado centralizado para o chat.
 */

const ChatState = {
  conversas: [],       // [{ solicitacao_id, titulo, unread, mensagens[] }]
  ativa: null,         // id da conversa aberta
  aberto: false,
  pollingId: null,
  typingPollingId: null,
  lastTypingSent: 0,
  inicializado: false,
  usuario: null,

  // Constantes
  POLL_INTERVAL: 3000,
  STORAGE_KEY: 'unicaronas_chat_aberto',

  // Métodos auxiliares de estado
  getConversaAtiva() {
    return this.conversas.find(c => c.solicitacao_id === this.ativa);
  },

  getTotalUnread() {
    return this.conversas.reduce((sum, c) => sum + (c.unread || 0), 0);
  }
};

/**
 * UniCaronas — chat-polling.js
 * Gerenciamento de polling para mensagens e digitação.
 */

const ChatPolling = {
  iniciar() {
    this.parar();

    // Polling de mensagens
    ChatState.pollingId = setInterval(async () => {
      if (typeof ChatGlobal !== 'undefined') {
        await ChatGlobal.atualizarMensagens();
      }
    }, ChatState.POLL_INTERVAL);

    // Polling de digitação (apenas se chat aberto e conversa ativa)
    ChatState.typingPollingId = setInterval(async () => {
      if (ChatState.aberto && ChatState.ativa) {
        try {
          const res = await ChatAPI.verificarDigitando(ChatState.ativa);
          const indicator = document.getElementById('uc-typing-indicator');
          if (indicator) {
            indicator.style.display = res.typing ? 'block' : 'none';
          }
        } catch (_) {}
      }
    }, 2000);

    // Recarregar lista completa a cada 30s
    this.recalcId = setInterval(() => {
      if (typeof ChatGlobal !== 'undefined') {
        ChatGlobal.carregarConversas();
      }
    }, 30000);
  },

  parar() {
    if (ChatState.pollingId) clearInterval(ChatState.pollingId);
    if (ChatState.typingPollingId) clearInterval(ChatState.typingPollingId);
    if (this.recalcId) clearInterval(this.recalcId);
  }
};

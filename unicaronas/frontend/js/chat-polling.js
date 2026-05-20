/**
 * UniCaronas — chat-polling.js
 * Gerenciamento de polling para mensagens e digitação via PollingManager.
 */
import { PollingManager } from './polling-manager.js';

export const ChatPolling = {
  iniciar(chatOrquestrador) {
    // Polling de mensagens
    PollingManager.registerTask('chat-mensagens', async () => {
      if (chatOrquestrador && typeof chatOrquestrador.atualizarMensagens === 'function') {
        await chatOrquestrador.atualizarMensagens();
      }
    }, 5000);

    // Polling de digitação
    PollingManager.registerTask('chat-typing', async () => {
      if (typeof ChatState !== 'undefined' && ChatState.aberto && ChatState.ativa) {
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
    PollingManager.registerTask('chat-recalc', () => {
      if (chatOrquestrador && typeof chatOrquestrador.carregarConversas === 'function') {
        chatOrquestrador.carregarConversas();
      }
    }, 30000);

    PollingManager.start();
  },

  parar() {
    PollingManager.unregisterTask('chat-mensagens');
    PollingManager.unregisterTask('chat-typing');
    PollingManager.unregisterTask('chat-recalc');
  }
};

// Expondo para o escopo global para compatibilidade se necessário
if (typeof window !== 'undefined') {
  window.ChatPolling = ChatPolling;
}

/**
 * UniCaronas — notificacoes-global.js (Entry Point Module)
 * Inicializa o sistema de notificações modularizado.
 */
import { NotificacoesUI } from './notificacoes-ui.js';
import { PollingManager } from './polling-manager.js';

const initNotificacoes = () => {
  if (!isLogado()) return;

  // Inicializa UI
  NotificacoesUI.init();

  // Registra tarefa de polling
  PollingManager.registerTask('notificacoes-recarregar', () => NotificacoesUI.atualizar(), 10000);
  
  // Inicia o loop centralizado se ainda não estiver rodando
  PollingManager.start();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificacoes);
} else {
  initNotificacoes();
}

// Exporta para compatibilidade se necessário, embora agora seja um módulo
export { NotificacoesUI };

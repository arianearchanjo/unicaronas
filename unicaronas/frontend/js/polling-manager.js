// frontend/js/polling-manager.js

/**
 * Gerenciador de Polling Centralizado
 * Evita múltiplos intervalos concorrentes disparados por diferentes módulos.
 */
export const PollingManager = {
  intervals: new Map(),
  tasks: new Map(),
  masterInterval: null,
  tickRate: 1000, // 1 segundo
  counter: 0,

  /**
   * Registra uma tarefa para execução periódica.
   * @param {string} id - Identificador único da tarefa.
   * @param {Function} callback - Função a ser executada.
   * @param {number} intervalMs - Intervalo em milissegundos (múltiplo de 1000).
   */
  registerTask(id, callback, intervalMs) {
    this.tasks.set(id, {
      callback,
      interval: intervalMs,
      lastRun: 0
    });
  },

  unregisterTask(id) {
    this.tasks.delete(id);
  },

  start() {
    if (this.masterInterval) return;

    this.masterInterval = setInterval(() => {
      this.counter += this.tickRate;
      const now = Date.now();

      this.tasks.forEach((task, id) => {
        if (now - task.lastRun >= task.interval) {
          task.callback();
          task.lastRun = now;
        }
      });
    }, this.tickRate);
  },

  stop() {
    if (this.masterInterval) {
      clearInterval(this.masterInterval);
      this.masterInterval = null;
    }
  }
};

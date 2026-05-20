/**
 * Utilitário de log condicional para o backend.
 * Garante que logs informativos não poluam a produção.
 */
const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  log: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Erros críticos devem ser logados mesmo em produção, 
    // mas podem ser direcionados para um serviço de monitoramento no futuro.
    console.error(...args);
  },
  warn: (...args) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (!isProduction) {
      console.info(...args);
    }
  }
};

module.exports = logger;

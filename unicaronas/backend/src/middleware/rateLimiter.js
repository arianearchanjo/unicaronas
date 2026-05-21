const rateLimit = require('express-rate-limit');

/**
 * Limiter global para toda a API
 * 100 requisições por minuto (ajustado para suportar polling e navegação rápida)
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100,
  message: {
    success: false,
    error: 'Muitas requisições vindas deste IP, tente novamente em um minuto.'
  },
  standardHeaders: true, 
  legacyHeaders: false,
});

/**
 * Limiter específico para autenticação (Login e Cadastro)
 * 10 tentativas em 15 minutos
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: {
    success: false,
    error: 'Muitas tentativas de acesso, tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Retorna HTTP 429 por padrão, mas garantindo aqui conforme pedido
  statusCode: 429, 
});

module.exports = {
  apiLimiter,
  authLimiter
};

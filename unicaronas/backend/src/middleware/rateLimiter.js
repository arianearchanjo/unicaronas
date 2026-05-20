const rateLimit = require('express-rate-limit');

/**
 * Limiter global para toda a API
 * 20 requisições por minuto
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20,
  message: {
    success: false,
    error: 'Muitas requisições vindas deste IP, tente novamente em um minuto.'
  },
  standardHeaders: true, // Retorna as informações de limite nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita os headers `X-RateLimit-*`
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

const { dominiosAutorizados, dominioAdmin } = require('../config/dominiosAutorizados');

/**
 * Middleware para verificar se o domínio do e-mail é autorizado.
 * Permite domínios universitários da lista e o domínio administrativo.
 */
const verificarDominioEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(); // Deixa a validação de presença para o middleware de validação principal
  }

  const partes = email.split('@');
  if (partes.length !== 2) {
    return res.status(400).json({
      success: false,
      error: 'Formato de e-mail inválido.'
    });
  }

  const dominio = partes[1].toLowerCase();

  // 1. Verificar se é o domínio de admin
  if (dominio === dominioAdmin) {
    return next();
  }

  // 2. Verificar se está na lista de domínios universitários autorizados
  const isAutorizado = dominiosAutorizados.some(d => dominio === d.toLowerCase() || dominio.endsWith('.' + d.toLowerCase()));

  if (!isAutorizado) {
    return res.status(403).json({
      success: false,
      error: 'O cadastro é restrito a e-mails universitários autorizados.'
    });
  }

  next();
};

module.exports = { verificarDominioEmail };

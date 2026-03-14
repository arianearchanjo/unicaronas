/**
 * Middleware centralizado de tratamento de erros.
 * Distingue erros conhecidos (operacionais) de erros inesperados.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Erros de constraint do PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'Registro duplicado' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, error: 'Referência a registro inexistente' });
  }
  if (err.code === '23514') {
    return res.status(400).json({ success: false, error: 'Valor fora do intervalo permitido' });
  }

  // Erros de JSON malformado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'JSON inválido no corpo da requisição' });
  }

  // Log apenas de erros inesperados
  console.error('[ErrorHandler]', err.message, err.stack);

  res.status(500).json({ success: false, error: 'Erro interno do servidor' });
};

module.exports = errorHandler;
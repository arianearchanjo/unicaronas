/**
 * Middleware de validação de entrada reutilizável.
 * Uso: validar(schema) onde schema é { campo: { required, type, min, max, maxLength, regex } }
 *
 * Exemplo:
 *   router.post('/', validar({
 *     nome:  { required: true, type: 'string', maxLength: 100 },
 *     nota:  { required: true, type: 'integer', min: 1, max: 5 },
 *   }), ctrl.criar);
 */
const validar = (schema) => (req, res, next) => {
  const erros = [];

  for (const [campo, regras] of Object.entries(schema)) {
    const valor = req.body[campo];
    const ausente = valor === undefined || valor === null || valor === '';

    if (regras.required && ausente) {
      erros.push(`O campo "${campo}" é obrigatório`);
      continue; // sem mais checagens se ausente e obrigatório
    }

    if (ausente) continue; // campo opcional não informado — OK

    if (regras.type === 'string' && typeof valor !== 'string') {
      erros.push(`O campo "${campo}" deve ser texto`);
    }

    if (regras.type === 'number' || regras.type === 'integer') {
      if (isNaN(Number(valor))) {
        erros.push(`O campo "${campo}" deve ser numérico`);
      } else if (regras.type === 'integer' && !Number.isInteger(Number(valor))) {
        erros.push(`O campo "${campo}" deve ser um número inteiro`);
      }
    }

    if (typeof valor === 'string' && regras.maxLength && valor.length > regras.maxLength) {
      erros.push(`O campo "${campo}" deve ter no máximo ${regras.maxLength} caracteres`);
    }

    if (typeof valor === 'string' && regras.minLength && valor.length < regras.minLength) {
      erros.push(`O campo "${campo}" deve ter no mínimo ${regras.minLength} caracteres`);
    }

    const num = Number(valor);
    if (regras.min !== undefined && num < regras.min) {
      erros.push(`O campo "${campo}" deve ser no mínimo ${regras.min}`);
    }
    if (regras.max !== undefined && num > regras.max) {
      erros.push(`O campo "${campo}" deve ser no máximo ${regras.max}`);
    }

    if (regras.regex && !regras.regex.test(String(valor))) {
      erros.push(regras.regexMsg || `O campo "${campo}" tem formato inválido`);
    }
  }

  if (erros.length > 0) {
    return res.status(400).json({ success: false, error: erros[0], detalhes: erros });
  }

  next();
};

module.exports = { validar };
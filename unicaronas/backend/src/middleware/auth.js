// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido'
    });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado'
    });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.usuario || !req.usuario.is_admin) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas administradores podem realizar esta ação.'
    });
  }
  next();
};

module.exports = { auth, adminOnly };

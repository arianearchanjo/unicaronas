// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
<<<<<<< HEAD
  const token = req.cookies.token;

=======
  const header = req.headers.authorization;
  let token = null;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

>>>>>>> 956f0166340ffc5c9ef63ef82a1e0826512fb02e
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido'
    });
  }

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

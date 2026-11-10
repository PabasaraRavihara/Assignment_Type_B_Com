const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT token on protected endpoints
 */
const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. Missing or malformed Authorization header. Expected Bearer <token>.'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid or expired session token. Please log in again.'
    });
  }

  req.user = decoded;
  next();
};

module.exports = {
  requireAdminAuth
};

const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const config = require('../config/env');
const { AppError, asyncHandler } = require('../utils/helpers');

const userSelect = { id: true, email: true, name: true, role: true, phone: true, avatar: true, isActive: true };

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  if (decoded.type && decoded.type !== 'user') {
    throw new AppError('Invalid token type', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: userSelect });

  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (roles.length && !roles.includes(req.user.role)) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

module.exports = { authenticate, authorize, userSelect };

const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const config = require('../config/env');
const { AppError, asyncHandler } = require('../utils/helpers');

const authenticateCustomer = asyncHandler(async (req, res, next) => {
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

  if (decoded.type !== 'customer') {
    throw new AppError('Invalid token type', 401);
  }

  const customer = await prisma.customer.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, name: true, phone: true, address: true, avatar: true, isActive: true },
  });

  if (!customer || !customer.isActive || !customer.email) {
    throw new AppError('Customer not found or inactive', 401);
  }

  req.customer = customer;
  next();
});

module.exports = { authenticateCustomer };

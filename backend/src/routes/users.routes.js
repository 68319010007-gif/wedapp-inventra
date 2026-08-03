const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { authenticate, authorize, userSelect } = require('../middleware/auth');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');

// users.routes.js content - will write full file
const express = require('express');
const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const { skip, take, page: p, limit: l } = paginate(page, limit);
  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, select: { ...userSelect, createdAt: true }, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);
  success(res, { items: users, pagination: { page: p, limit: l, total } });
}));

router.post('/', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { email, password, name, role, phone } = req.body;
  if (!email || !password || !name) throw new AppError('Email, password and name are required');
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError('Email already exists');
  const user = await prisma.user.create({
    data: { email, password: await bcrypt.hash(password, 10), name, role: role || 'STAFF', phone },
    select: userSelect,
  });
  success(res, user, 'User created', 201);
}));

router.put('/:id', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { name, role, phone, isActive, password, avatar } = req.body;
  const data = { name, role, phone, isActive, avatar };
  if (password) data.password = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: userSelect });
  success(res, user, 'User updated');
}));

router.delete('/:id', authorize('ADMIN'), asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new AppError('Cannot delete your own account');
  await prisma.user.delete({ where: { id: req.params.id } });
  success(res, null, 'User deleted');
}));

module.exports = router;

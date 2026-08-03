const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { authenticate, userSelect } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { AppError, asyncHandler, success } = require('../utils/helpers');
const { signToken } = require('../utils/jwt');

const router = express.Router();

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password are required');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const token = signToken({ id: user.id, email: user.email, role: user.role, type: 'user' });
    req.user = user;
    await auditLog(req, 'LOGIN', 'auth', `User ${user.email} logged in`);

    success(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    }, 'Login successful');
  })
);

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  success(res, req.user);
}));

router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, phone, avatar },
    select: userSelect,
  });
  success(res, user, 'Profile updated');
}));

router.put('/password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Current and new password are required');
  if (newPassword.length < 6) throw new AppError('Password must be at least 6 characters');

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });
  success(res, null, 'Password updated');
}));

module.exports = router;

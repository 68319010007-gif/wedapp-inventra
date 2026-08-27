const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { authenticateCustomer } = require('../middleware/customerAuth');
const { AppError, asyncHandler, success } = require('../utils/helpers');
const { signToken } = require('../utils/jwt');
const upload = require('../middleware/upload');

const router = express.Router();

const customerSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  address: true,
  avatar: true,
  taxId: true,
  code: true,
  marketingConsent: true,
};

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, name, phone, address } = req.body;
    if (!email || !password || !name || !phone) {
      throw new AppError('Email, password, name and phone are required');
    }
    if (password.length < 6) throw new AppError('Password must be at least 6 characters');

    const exists = await prisma.customer.findUnique({ where: { email } });
    if (exists) throw new AppError('Email already registered');

    const count = await prisma.customer.count();
    const hashed = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: {
        code: `MEM-${String(count + 1).padStart(5, '0')}`,
        email,
        password: hashed,
        name,
        phone,
        address: address || null,
      },
      select: customerSelect,
    });

    const token = signToken({ id: customer.id, email: customer.email, type: 'customer' });
    success(res, { token, customer }, 'Registration successful', 201);
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password are required');

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer || !customer.password || !customer.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const token = signToken({ id: customer.id, email: customer.email, type: 'customer' });
    const { password: _, ...safe } = customer;
    success(res, { token, customer: safe }, 'Login successful');
  })
);

router.get(
  '/me',
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    success(res, req.customer);
  })
);

router.put(
  '/profile',
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const { name, phone, address, avatar, taxId, marketingConsent } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.customer.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(avatar !== undefined && { avatar }),
        ...(taxId !== undefined && { taxId }),
        ...(marketingConsent !== undefined && { marketingConsent: !!marketingConsent }),
      },
      select: customerSelect,
    });
    success(res, customer, 'Profile updated');
  })
);

router.put(
  '/password',
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new AppError('Current and new password are required');
    if (newPassword.length < 6) throw new AppError('Password must be at least 6 characters');

    const customer = await prisma.customer.findUnique({ where: { id: req.customer.id } });
    const valid = await bcrypt.compare(currentPassword, customer.password);
    if (!valid) throw new AppError('Current password is incorrect', 401);

    await prisma.customer.update({
      where: { id: req.customer.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });
    success(res, null, 'Password updated');
  })
);

router.post(
  '/upload',
  authenticateCustomer,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No file uploaded');
    success(res, { url: `/uploads/${req.file.filename}`, filename: req.file.filename }, 'Uploaded', 201);
  })
);

module.exports = router;

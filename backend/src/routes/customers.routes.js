const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.customer.count({ where }),
    ]);

    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { salesOrders: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!customer) throw new AppError('Customer not found', 404);
    success(res, customer);
  })
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { code, name, email, phone, address, taxId } = req.body;
    if (!code || !name) throw new AppError('Code and name are required');

    const customer = await prisma.customer.create({
      data: { code, name, email, phone, address, taxId },
    });
    success(res, customer, 'Customer created', 201);
  })
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    success(res, customer, 'Customer updated');
  })
);

router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    await prisma.customer.delete({ where: { id: req.params.id } });
    success(res, null, 'Customer deleted');
  })
);

module.exports = router;

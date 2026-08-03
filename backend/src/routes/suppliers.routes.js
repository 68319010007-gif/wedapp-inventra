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
      prisma.supplier.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.supplier.count({ where }),
    ]);

    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { code, name, email, phone, address, contact } = req.body;
    if (!code || !name) throw new AppError('Code and name are required');
    const supplier = await prisma.supplier.create({ data: { code, name, email, phone, address, contact } });
    success(res, supplier, 'Supplier created', 201);
  })
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
    success(res, supplier, 'Supplier updated');
  })
);

router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    success(res, null, 'Supplier deleted');
  })
);

module.exports = router;

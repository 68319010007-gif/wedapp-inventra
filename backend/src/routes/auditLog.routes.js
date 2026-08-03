const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, success, paginate } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, module: mod } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = mod ? { module: mod } : {};

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

module.exports = router;

const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        include: {
          order: { include: { customer: { select: { id: true, name: true, code: true } } } },
          verifiedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        order: { include: { customer: true, items: { include: { product: true } } } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    success(res, payment);
  })
);

router.patch(
  '/:id/verify',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { order: true } });
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.status === 'VERIFIED') throw new AppError('Payment already verified');

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'VERIFIED', note: null, verifiedById: req.user.id },
      include: { order: { include: { customer: true } } },
    });

    await auditLog(req, 'VERIFY_PAYMENT', 'payments', `${payment.order.orderNo} payment verified`);
    success(res, updated, 'Payment verified');
  })
);

router.patch(
  '/:id/reject',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { note } = req.body;
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { order: true } });
    if (!payment) throw new AppError('Payment not found', 404);

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REJECTED', note: note || 'Payment slip could not be verified', verifiedById: req.user.id },
      include: { order: { include: { customer: true } } },
    });

    await auditLog(req, 'REJECT_PAYMENT', 'payments', `${payment.order.orderNo} payment rejected`);
    success(res, updated, 'Payment rejected');
  })
);

module.exports = router;

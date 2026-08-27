const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { AppError, asyncHandler, success } = require('../utils/helpers');

const router = express.Router();

function parseChannelBody(body) {
  const {
    name,
    bankName,
    accountName,
    accountNumber,
    qrImageUrl,
    note,
    isActive,
    sortOrder,
  } = body;

  if (!name?.trim()) throw new AppError('Channel name is required');
  if (!accountName?.trim()) throw new AppError('Account name is required');
  if (!accountNumber?.trim()) throw new AppError('Account number is required');

  return {
    name: name.trim(),
    bankName: bankName?.trim() || null,
    accountName: accountName.trim(),
    accountNumber: accountNumber.trim(),
    qrImageUrl: qrImageUrl?.trim() || null,
    note: note?.trim() || null,
    isActive: isActive === undefined ? true : !!isActive,
    sortOrder: sortOrder != null && sortOrder !== '' ? Number(sortOrder) || 0 : 0,
  };
}

/** Public / storefront — active channels only */
router.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const items = await prisma.paymentChannel.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        bankName: true,
        accountName: true,
        accountNumber: true,
        qrImageUrl: true,
        note: true,
      },
    });
    success(res, { items });
  })
);

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (_req, res) => {
    const items = await prisma.paymentChannel.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    success(res, { items });
  })
);

router.get(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const channel = await prisma.paymentChannel.findUnique({ where: { id: req.params.id } });
    if (!channel) throw new AppError('Payment channel not found', 404);
    success(res, channel);
  })
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const data = parseChannelBody(req.body);
    const created = await prisma.paymentChannel.create({ data });
    await auditLog(req, 'CREATE_PAYMENT_CHANNEL', 'payment_channels', created.name);
    success(res, created, 'Payment channel created', 201);
  })
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.paymentChannel.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Payment channel not found', 404);

    const data = parseChannelBody(req.body);
    const updated = await prisma.paymentChannel.update({
      where: { id: existing.id },
      data,
    });
    await auditLog(req, 'UPDATE_PAYMENT_CHANNEL', 'payment_channels', updated.name);
    success(res, updated, 'Payment channel updated');
  })
);

router.patch(
  '/:id/toggle',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.paymentChannel.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Payment channel not found', 404);

    const updated = await prisma.paymentChannel.update({
      where: { id: existing.id },
      data: { isActive: !existing.isActive },
    });
    await auditLog(
      req,
      'TOGGLE_PAYMENT_CHANNEL',
      'payment_channels',
      `${updated.name} → ${updated.isActive ? 'active' : 'inactive'}`
    );
    success(res, updated, 'Payment channel toggled');
  })
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.paymentChannel.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Payment channel not found', 404);

    await prisma.paymentChannel.delete({ where: { id: existing.id } });
    await auditLog(req, 'DELETE_PAYMENT_CHANNEL', 'payment_channels', existing.name);
    success(res, null, 'Payment channel deleted');
  })
);

module.exports = router;

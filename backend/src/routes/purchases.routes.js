const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');
const { emitStockUpdate } = require('../socket');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        include: {
          supplier: { select: { id: true, name: true, code: true } },
          items: { include: { product: { select: { sku: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { supplierId, items, note } = req.body;
    if (!supplierId || !items?.length) throw new AppError('supplierId and items are required');

    const count = await prisma.purchaseOrder.count();
    const poNo = `PO-${String(count + 1).padStart(5, '0')}`;

    let subtotal = 0;
    const poItems = items.map((item) => {
      const total = Number(item.unitCost) * item.quantity;
      subtotal += total;
      return { productId: item.productId, quantity: item.quantity, unitCost: item.unitCost, total };
    });

    const purchase = await prisma.purchaseOrder.create({
      data: {
        poNo,
        supplierId,
        subtotal,
        total: subtotal,
        note,
        items: { create: poItems },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });

    await auditLog(req, 'CREATE_PO', 'purchases', poNo);
    success(res, purchase, 'Purchase order created', 201);
  })
);

router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const purchase = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!purchase) throw new AppError('Purchase order not found', 404);
    if (purchase.status === 'RECEIVED') throw new AppError('Cannot delete received purchase order');
    await prisma.purchaseOrder.delete({ where: { id: req.params.id } });
    await auditLog(req, 'DELETE_PO', 'purchases', purchase.poNo);
    success(res, null, 'Purchase order deleted');
  })
);

router.patch(
  '/:id/status',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) throw new AppError('Status is required');
    const purchase = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status, ...(status === 'ORDERED' && { orderedAt: new Date() }) },
      include: { supplier: true, items: { include: { product: true } } },
    });
    success(res, purchase, 'Purchase status updated');
  })
);

router.patch(
  '/:id/receive',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const purchase = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!purchase) throw new AppError('Purchase order not found', 404);
    if (purchase.status === 'RECEIVED') throw new AppError('Already received');

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        const inv = await tx.inventoryItem.findUnique({ where: { productId: item.productId } });
        if (inv) {
          await tx.inventoryItem.update({
            where: { productId: item.productId },
            data: { quantity: inv.quantity + item.quantity },
          });
        } else {
          await tx.inventoryItem.create({ data: { productId: item.productId, quantity: item.quantity } });
        }
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            reference: purchase.poNo,
            note: 'Purchase received',
            createdById: req.user.id,
          },
        });
      }

      return tx.purchaseOrder.update({
        where: { id: purchase.id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
        include: { supplier: true, items: { include: { product: true } } },
      });
    });

    for (const item of updated.items) {
      const inv = await prisma.inventoryItem.findUnique({ where: { productId: item.productId } });
      emitStockUpdate(item.productId, inv?.quantity ?? 0);
    }

    await auditLog(req, 'RECEIVE_PO', 'purchases', purchase.poNo);
    success(res, updated, 'Purchase order received');
  })
);

module.exports = router;

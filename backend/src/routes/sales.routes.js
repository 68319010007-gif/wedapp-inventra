const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');
const {
  shouldHaveStockDeducted,
  deductStock,
  restoreStock,
  broadcastStock,
} = require('../utils/stock');

const router = express.Router();
router.use(authenticate);

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { page, limit, status, search } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true } },
          items: { include: { product: { select: { sku: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

router.get(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    success(res, order);
  })
);

router.post(
  '/orders',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { customerId, items, discount, note, status } = req.body;
    if (!customerId || !items?.length) throw new AppError('customerId and items are required');

    const count = await prisma.salesOrder.count();
    const orderNo = `SO-${String(count + 1).padStart(5, '0')}`;

    let subtotal = 0;
    const orderItems = items.map((item) => {
      const total = Number(item.unitPrice) * item.quantity;
      subtotal += total;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total,
      };
    });

    const discountVal = Number(discount || 0);
    const total = subtotal - discountVal;

    const stockChanges = [];

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.salesOrder.create({
        data: {
          orderNo,
          customerId,
          status: status || 'PENDING',
          subtotal,
          discount: discountVal,
          total,
          note,
          createdById: req.user.id,
          items: { create: orderItems },
        },
        include: { customer: true, items: { include: { product: true } } },
      });

      if (shouldHaveStockDeducted(created.status)) {
        const deducted = await deductStock(tx, orderItems, {
          reference: orderNo,
          note: 'Sales order',
          createdById: req.user.id,
        });
        stockChanges.push(...deducted);
      }

      return created;
    });

    broadcastStock(stockChanges);

    await auditLog(req, 'CREATE_ORDER', 'sales', orderNo);
    success(res, order, 'Sales order created', 201);
  })
);

router.put(
  '/orders/:id',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { status, note, discount } = req.body;
    const stockChanges = [];

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.salesOrder.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      });
      if (!existing) throw new AppError('Order not found', 404);

      if (status && status !== existing.status) {
        const wasDeducted = shouldHaveStockDeducted(existing.status);
        const willDeduct = shouldHaveStockDeducted(status);
        if (!wasDeducted && willDeduct) {
          stockChanges.push(
            ...(await deductStock(tx, existing.items, {
              reference: existing.orderNo,
              note: `Status changed to ${status}`,
              createdById: req.user.id,
            }))
          );
        } else if (wasDeducted && !willDeduct) {
          stockChanges.push(
            ...(await restoreStock(tx, existing.items, {
              reference: existing.orderNo,
              note: `Status changed to ${status} — stock restored`,
              createdById: req.user.id,
            }))
          );
        }
      }

      return tx.salesOrder.update({
        where: { id: existing.id },
        data: {
          ...(status && { status }),
          ...(note !== undefined && { note }),
          ...(discount !== undefined && { discount: Number(discount) }),
        },
        include: { customer: true, items: { include: { product: true } } },
      });
    });

    broadcastStock(stockChanges);
    await auditLog(req, 'UPDATE_ORDER', 'sales', order.orderNo);
    success(res, order, 'Order updated');
  })
);

router.patch(
  '/orders/:id/status',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) throw new AppError('Status is required');

    const stockChanges = [];
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.salesOrder.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      });
      if (!existing) throw new AppError('Order not found', 404);

      const wasDeducted = shouldHaveStockDeducted(existing.status);
      const willDeduct = shouldHaveStockDeducted(status);
      if (!wasDeducted && willDeduct) {
        const deducted = await deductStock(tx, existing.items, {
          reference: existing.orderNo,
          note: `Status changed to ${status}`,
          createdById: req.user.id,
        });
        stockChanges.push(...deducted);
      } else if (wasDeducted && !willDeduct) {
        const restored = await restoreStock(tx, existing.items, {
          reference: existing.orderNo,
          note: `Status changed to ${status} — stock restored`,
          createdById: req.user.id,
        });
        stockChanges.push(...restored);
      }

      return tx.salesOrder.update({
        where: { id: existing.id },
        data: { status },
        include: { customer: true, items: true },
      });
    });

    broadcastStock(stockChanges);
    await auditLog(req, 'UPDATE_ORDER_STATUS', 'sales', `${order.orderNo} → ${status}`);
    success(res, order, 'Order status updated');
  })
);

router.delete(
  '/orders/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status === 'COMPLETED') throw new AppError('Cannot delete completed order');

    const stockChanges = [];
    await prisma.$transaction(async (tx) => {
      if (shouldHaveStockDeducted(order.status)) {
        const restored = await restoreStock(tx, order.items, {
          reference: order.orderNo,
          note: 'Sales order deleted — stock restored',
          createdById: req.user.id,
        });
        stockChanges.push(...restored);
      }
      await tx.salesOrder.delete({ where: { id: order.id } });
    });

    broadcastStock(stockChanges);
    await auditLog(req, 'DELETE_ORDER', 'sales', order.orderNo);
    success(res, null, 'Order deleted');
  })
);

module.exports = router;

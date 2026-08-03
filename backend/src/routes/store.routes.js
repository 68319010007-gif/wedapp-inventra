const express = require('express');
const prisma = require('../config/database');
const { authenticateCustomer } = require('../middleware/customerAuth');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');
const { emitStockUpdate } = require('../socket');

const router = express.Router();

const productInclude = {
  category: true,
  inventoryItems: true,
  images: { orderBy: { sortOrder: 'asc' } },
};

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    success(res, categories);
  })
);

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { page, limit, search, categoryId } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: productInclude,
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    const mapped = items.map((p) => ({
      ...p,
      stock: p.inventoryItems?.quantity ?? 0,
      inStock: (p.inventoryItems?.quantity ?? 0) > 0,
    }));

    success(res, { items: mapped, pagination: { page: p, limit: l, total } });
  })
);

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, isActive: true },
      include: productInclude,
    });
    if (!product) throw new AppError('Product not found', 404);

    success(res, {
      ...product,
      stock: product.inventoryItems?.quantity ?? 0,
      inStock: (product.inventoryItems?.quantity ?? 0) > 0,
    });
  })
);

router.post(
  '/checkout',
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const { items, note } = req.body;
    if (!items?.length) throw new AppError('Items are required');

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { inventoryItems: true },
      });
      if (!product || !product.isActive) throw new AppError(`Product not available: ${item.productId}`);
      const stock = product.inventoryItems?.quantity ?? 0;
      if (stock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`);
    }

    const count = await prisma.salesOrder.count();
    const orderNo = `SO-${String(count + 1).padStart(5, '0')}`;
    const customerRecord = req.customer;

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      const unitPrice = Number(product.sellPrice);
      const total = unitPrice * item.quantity;
      subtotal += total;
      orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, total });
    }

    const stockChanges = [];

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.salesOrder.create({
        data: {
          orderNo,
          customerId: customerRecord.id,
          status: 'PROCESSING',
          subtotal,
          discount: 0,
          total: subtotal,
          note: note || 'Online store order',
          items: { create: orderItems },
        },
        include: { customer: true, items: { include: { product: true } } },
      });

      for (const item of orderItems) {
        const inv = await tx.inventoryItem.findUnique({ where: { productId: item.productId } });
        const updated = await tx.inventoryItem.update({
          where: { productId: item.productId },
          data: { quantity: inv.quantity - item.quantity },
        });
        stockChanges.push({ productId: item.productId, quantity: updated.quantity });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            reference: orderNo,
            note: 'Online store checkout',
          },
        });
      }

      return created;
    });

    stockChanges.forEach(({ productId, quantity }) => emitStockUpdate(productId, quantity));

    success(res, order, 'Order placed successfully', 201);
  })
);

router.get(
  '/orders',
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = { customerId: req.customer.id };

    const [items, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take,
        include: { items: { include: { product: { select: { name: true, sku: true, image: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

router.get(
  '/orders/:id',
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const order = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, customerId: req.customer.id },
      include: { items: { include: { product: { select: { name: true, sku: true, image: true } } } } },
    });
    if (!order) throw new AppError('Order not found', 404);
    success(res, order);
  })
);

router.patch(
  '/orders/:id/cancel',
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const order = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, customerId: req.customer.id },
      include: { items: true },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status === 'CANCELLED') throw new AppError('Order is already cancelled');
    if (['SHIPPING', 'COMPLETED'].includes(order.status)) {
      throw new AppError('This order can no longer be cancelled — it has already been shipped or completed');
    }

    const stockChanges = [];

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const inv = await tx.inventoryItem.findUnique({ where: { productId: item.productId } });
        const newQty = (inv?.quantity ?? 0) + item.quantity;
        if (inv) {
          await tx.inventoryItem.update({ where: { productId: item.productId }, data: { quantity: newQty } });
        } else {
          await tx.inventoryItem.create({ data: { productId: item.productId, quantity: newQty } });
        }
        stockChanges.push({ productId: item.productId, quantity: newQty });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            reference: order.orderNo,
            note: 'Order cancelled by customer — stock restored',
          },
        });
      }

      return tx.salesOrder.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
        include: { items: { include: { product: { select: { name: true, sku: true, image: true } } } } },
      });
    });

    stockChanges.forEach(({ productId, quantity }) => emitStockUpdate(productId, quantity));

    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'CANCEL_ORDER',
        module: 'sales',
        detail: `${order.orderNo} cancelled by customer ${req.customer.name} (${req.customer.email || req.customer.id})`,
        ip: req.ip,
      },
    });

    success(res, updated, 'Order cancelled');
  })
);

module.exports = router;

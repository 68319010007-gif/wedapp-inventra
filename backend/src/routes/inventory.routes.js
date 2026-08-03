const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');
const { emitStockUpdate } = require('../socket');

const router = express.Router();
router.use(authenticate);

router.get(
  '/stock',
  asyncHandler(async (req, res) => {
    const { page, limit, search, lowStock } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const products = await prisma.product.findMany({
      where: search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] }
        : {},
      include: { inventoryItems: true, category: true },
      skip,
      take,
      orderBy: { name: 'asc' },
    });

    let items = products.map((p) => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category?.name,
      quantity: p.inventoryItems?.quantity ?? 0,
      minStock: p.minStock,
      isLowStock: (p.inventoryItems?.quantity ?? 0) <= p.minStock,
    }));

    if (lowStock === 'true') items = items.filter((i) => i.isLowStock);

    const total = await prisma.product.count();
    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

router.get(
  '/movements',
  asyncHandler(async (req, res) => {
    const { page, limit, productId } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = productId ? { productId } : {};
    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take,
        include: { product: { select: { sku: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

router.post(
  '/movements',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { productId, type, quantity, reference, note } = req.body;
    if (!productId || !type || !quantity) throw new AppError('productId, type and quantity are required');
    if (!['IN', 'OUT', 'ADJUST'].includes(type)) throw new AppError('Invalid movement type');

    const qty = parseInt(quantity, 10);
    if (qty <= 0) throw new AppError('Quantity must be positive');

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { productId } });
      if (!item) throw new AppError('Inventory item not found', 404);

      let newQty = item.quantity;
      if (type === 'IN') newQty += qty;
      else if (type === 'OUT') {
        if (item.quantity < qty) throw new AppError('Insufficient stock');
        newQty -= qty;
      } else newQty = qty;

      await tx.inventoryItem.update({ where: { productId }, data: { quantity: newQty } });
      const movement = await tx.stockMovement.create({
        data: { productId, type, quantity: qty, reference, note, createdById: req.user.id },
      });
      return { movement, newQty };
    });

    await auditLog(req, 'STOCK_MOVEMENT', 'inventory', `${type} ${qty} for product ${productId}`);
    emitStockUpdate(productId, result.newQty);
    success(res, result, 'Stock movement recorded', 201);
  })
);

module.exports = router;

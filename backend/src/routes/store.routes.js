const express = require('express');
const prisma = require('../config/database');
const { authenticateCustomer } = require('../middleware/customerAuth');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');
const upload = require('../middleware/upload');
const {
  shouldHaveStockDeducted,
  restoreStock,
  assertStockAvailable,
  broadcastStock,
} = require('../utils/stock');
const { buildCategoryTree, getDescendantIds } = require('../utils/categories');

const router = express.Router();

const productInclude = {
  category: { include: { parent: { include: { parent: true } } } },
  inventoryItems: true,
  images: { orderBy: { sortOrder: 'asc' } },
};

const orderInclude = {
  items: { include: { product: { select: { name: true, sku: true, image: true } } } },
  payment: true,
};

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    success(res, { items: categories, tree: buildCategoryTree(categories) });
  })
);

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { page, limit, search, categoryId } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = { isActive: true };
    if (categoryId) {
      const allCategories = await prisma.category.findMany({ select: { id: true, parentId: true } });
      const ids = getDescendantIds(categoryId, allCategories);
      where.categoryId = { in: ids };
    }
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

async function getReviewEligibility(customerId, productId) {
  if (!customerId) return { canReview: false, reason: 'login_required' };
  const existing = await prisma.productReview.findUnique({
    where: { productId_customerId: { productId, customerId } },
  });
  if (existing) return { canReview: false, reason: 'already_reviewed', review: existing };

  const purchased = await prisma.salesOrderItem.findFirst({
    where: {
      productId,
      order: { customerId, status: { not: 'CANCELLED' } },
    },
  });
  if (!purchased) return { canReview: false, reason: 'not_purchased' };
  return { canReview: true };
}

router.get(
  '/products/:id/reviews',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, isActive: true } });
    if (!product) throw new AppError('Product not found', 404);

    const reviews = await prisma.productReview.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    });

    const agg = await prisma.productReview.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    success(res, {
      items: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        customerName: r.customer.name?.split(' ')[0] || 'Customer',
      })),
      summary: {
        average: agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 0,
        count: agg._count.rating,
      },
    });
  })
);

router.get(
  '/products/:id/reviews/eligibility',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, isActive: true } });
    if (!product) throw new AppError('Product not found', 404);

    let customerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const config = require('../config/env');
        const decoded = jwt.verify(authHeader.slice(7), config.jwtSecret);
        customerId = decoded.id;
      } catch {
        /* ignore invalid token */
      }
    }

    const eligibility = await getReviewEligibility(customerId, product.id);
    success(res, eligibility);
  })
);

router.post(
  '/products/:id/reviews',
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await prisma.product.findFirst({ where: { id: req.params.id, isActive: true } });
    if (!product) throw new AppError('Product not found', 404);

    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw new AppError('Rating must be between 1 and 5');
    }

    const eligibility = await getReviewEligibility(req.customer.id, product.id);
    if (!eligibility.canReview) {
      if (eligibility.reason === 'already_reviewed') throw new AppError('You have already reviewed this product', 409);
      if (eligibility.reason === 'not_purchased') throw new AppError('You can only review products you have purchased', 403);
      throw new AppError('Cannot submit review', 403);
    }

    const review = await prisma.productReview.create({
      data: {
        productId: product.id,
        customerId: req.customer.id,
        rating: stars,
        comment: comment?.trim() || null,
      },
    });

    success(res, review, 'Review submitted', 201);
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
    const { items, note, customer, shippingAddress } = req.body;
    if (!items?.length) throw new AppError('Items are required');

    const shippingLines = [];
    if (customer?.name) shippingLines.push(`Ship to: ${customer.name}`);
    if (customer?.phone) shippingLines.push(`Phone: ${customer.phone}`);
    if (customer?.address) shippingLines.push(`Address: ${customer.address}`);

    const noteParts = [];
    if (note?.trim()) noteParts.push(note.trim());
    if (shippingAddress && typeof shippingAddress === 'object') {
      noteParts.push(`---SHIPPING---\n${JSON.stringify(shippingAddress)}`);
    }
    if (shippingLines.length) noteParts.push(shippingLines.join(' | '));
    const fullNote = noteParts.join('\n') || 'Online store order';

    const customerRecord = req.customer;

    const order = await prisma.$transaction(async (tx) => {
      await assertStockAvailable(tx, items);

      let subtotal = 0;
      const orderItems = [];
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const unitPrice = Number(product.sellPrice);
        const total = unitPrice * item.quantity;
        subtotal += total;
        orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, total });
      }

      const count = await tx.salesOrder.count();
      const orderNo = `SO-${String(count + 1).padStart(5, '0')}`;

      return tx.salesOrder.create({
        data: {
          orderNo,
          customerId: customerRecord.id,
          status: 'PENDING',
          subtotal,
          discount: 0,
          total: subtotal,
          note: fullNote || 'Online store order',
          items: { create: orderItems },
        },
        include: { customer: true, items: { include: { product: true } }, payment: true },
      });
    });

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
        include: orderInclude,
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
      include: orderInclude,
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
      throw new AppError('This order can no longer be cancelled Ã¢ÂÂ it has already been shipped or completed');
    }

    const stockChanges = [];

    const updated = await prisma.$transaction(async (tx) => {
      if (shouldHaveStockDeducted(order.status)) {
        const restored = await restoreStock(tx, order.items, {
          reference: order.orderNo,
          note: 'Order cancelled by customer Ã¢ÂÂ stock restored',
        });
        stockChanges.push(...restored);
      }

      return tx.salesOrder.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
        include: orderInclude,
      });
    });

    broadcastStock(stockChanges);

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

router.post(
  '/orders/:id/payment',
  authenticateCustomer,
  upload.single('slip'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No payment slip uploaded');

    const order = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, customerId: req.customer.id },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status === 'CANCELLED') throw new AppError('Cannot submit payment for a cancelled order');

    const slipUrl = `/uploads/${req.file.filename}`;

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { slipUrl, status: 'PENDING', note: null, verifiedById: null },
      create: { orderId: order.id, slipUrl, status: 'PENDING' },
    });

    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'SUBMIT_PAYMENT',
        module: 'payments',
        detail: `${order.orderNo} payment slip submitted by ${req.customer.name} (${req.customer.email || req.customer.id})`,
        ip: req.ip,
      },
    });

    success(res, payment, 'Payment notification submitted', 201);
  })
);

module.exports = router;

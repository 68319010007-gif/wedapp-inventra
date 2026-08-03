const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, success } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const [totalProducts, totalOrders, salesAgg, lowStockProducts, recentOrders, categoryStats] =
      await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.salesOrder.count(),
        prisma.salesOrder.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
        prisma.product.findMany({
          include: { inventoryItems: true, category: true },
        }).then((products) =>
          products.filter((p) => (p.inventoryItems?.quantity ?? 0) <= p.minStock).length
        ),
        prisma.salesOrder.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { name: true } } },
        }),
        prisma.category.findMany({
          include: { products: { include: { inventoryItems: true } } },
        }),
      ]);

    const topCategories = categoryStats.map((cat) => ({
      name: cat.name,
      count: cat.products.length,
      value: cat.products.reduce((sum, p) => sum + (p.inventoryItems?.quantity ?? 0), 0),
    }));

    success(res, {
      totalProducts,
      lowStockItems: lowStockProducts,
      totalOrders,
      totalSales: Number(salesAgg._sum.total || 0),
      recentOrders,
      topCategories,
    });
  })
);

router.get(
  '/sales',
  asyncHandler(async (req, res) => {
    const orders = await prisma.salesOrder.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { total: true, createdAt: true, status: true },
      orderBy: { createdAt: 'desc' },
    });
    success(res, orders);
  })
);

router.get(
  '/inventory',
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      include: { inventoryItems: true, category: true },
      orderBy: { name: 'asc' },
    });
    success(res, products);
  })
);

module.exports = router;

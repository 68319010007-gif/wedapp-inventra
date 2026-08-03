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
        prisma.product
          .findMany({ include: { inventoryItems: true } })
          .then((products) => products.filter((p) => (p.inventoryItems?.quantity ?? 0) <= p.minStock).length),
        prisma.salesOrder.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { name: true } } },
        }),
        prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
      ]);

    success(res, {
      totalProducts,
      lowStockItems: lowStockProducts,
      totalOrders,
      totalSales: Number(salesAgg._sum.total || 0),
      recentOrders,
      topCategories: categoryStats.map((c) => ({ name: c.name, count: c._count.products })),
    });
  })
);

module.exports = router;

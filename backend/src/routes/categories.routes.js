const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError, asyncHandler, success } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
    success(res, categories);
  })
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name) throw new AppError('Name is required');
    const category = await prisma.category.create({ data: { name, description } });
    success(res, category, 'Category created', 201);
  })
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    success(res, category, 'Category updated');
  })
);

router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: req.params.id } });
    success(res, null, 'Category deleted');
  })
);

module.exports = router;

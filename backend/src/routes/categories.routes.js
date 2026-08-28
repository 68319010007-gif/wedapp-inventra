const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError, asyncHandler, success } = require('../utils/helpers');
const { buildCategoryTree } = require('../utils/categories');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
      },
    });
    success(res, { items: categories, tree: buildCategoryTree(categories) });
  })
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const { name, description, parentId, sortOrder } = req.body;
    if (!name?.trim()) throw new AppError('Name is required');

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) throw new AppError('Parent category not found', 404);
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        parentId: parentId || null,
        sortOrder: sortOrder != null && sortOrder !== '' ? Number(sortOrder) || 0 : 0,
      },
    });
    success(res, category, 'Category created', 201);
  })
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const { name, description, parentId, sortOrder } = req.body;
    if (parentId === req.params.id) throw new AppError('Category cannot be its own parent', 400);

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) throw new AppError('Parent category not found', 404);
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (parentId !== undefined) data.parentId = parentId || null;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;

    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    success(res, category, 'Category updated');
  })
);

router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const childCount = await prisma.category.count({ where: { parentId: req.params.id } });
    if (childCount > 0) throw new AppError('Cannot delete category with subcategories', 400);

    await prisma.category.delete({ where: { id: req.params.id } });
    success(res, null, 'Category deleted');
  })
);

module.exports = router;

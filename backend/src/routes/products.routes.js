const express = require('express');
const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const config = require('../config/env');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate);

const productInclude = {
  category: true,
  inventoryItems: true,
  images: { orderBy: { sortOrder: 'asc' } },
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, categoryId, lowStock } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    let items = await prisma.product.findMany({
      where,
      skip,
      take,
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });

    if (lowStock === 'true') {
      items = items.filter((p) => (p.inventoryItems?.quantity ?? 0) <= p.minStock);
    }

    const total = await prisma.product.count({ where });
    success(res, { items, pagination: { page: p, limit: l, total } });
  })
);

router.post(
  '/:id/images',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No file uploaded');
    const url = `/uploads/${req.file.filename}`;
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });
    if (!product) throw new AppError('Product not found', 404);

    const isFirst = product.images.length === 0;
    const image = await prisma.productImage.create({
      data: {
        productId: product.id,
        url,
        sortOrder: product.images.length,
        isPrimary: isFirst,
      },
    });

    if (isFirst) {
      await prisma.product.update({ where: { id: product.id }, data: { image: url } });
    }

    success(res, image, 'Image uploaded', 201);
  })
);

router.delete(
  '/:id/images/:imageId',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const image = await prisma.productImage.findFirst({
      where: { id: req.params.imageId, productId: req.params.id },
    });
    if (!image) throw new AppError('Image not found', 404);

    const filePath = path.join(process.cwd(), config.uploadDir, path.basename(image.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.productImage.delete({ where: { id: image.id } });

    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId: req.params.id },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
        await prisma.product.update({ where: { id: req.params.id }, data: { image: next.url } });
      } else {
        await prisma.product.update({ where: { id: req.params.id }, data: { image: null } });
      }
    }

    success(res, null, 'Image deleted');
  })
);

router.patch(
  '/:id/images/:imageId/primary',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const image = await prisma.productImage.findFirst({
      where: { id: req.params.imageId, productId: req.params.id },
    });
    if (!image) throw new AppError('Image not found', 404);

    await prisma.$transaction([
      prisma.productImage.updateMany({ where: { productId: req.params.id }, data: { isPrimary: false } }),
      prisma.productImage.update({ where: { id: image.id }, data: { isPrimary: true } }),
      prisma.product.update({ where: { id: req.params.id }, data: { image: image.url } }),
    ]);

    success(res, image, 'Primary image updated');
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude,
    });
    if (!product) throw new AppError('Product not found', 404);
    success(res, product);
  })
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const { sku, name, categoryId, unit, costPrice, sellPrice, minStock, barcode, description } = req.body;
    if (!sku || !name) throw new AppError('SKU and name are required');

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: { sku, name, categoryId, unit, costPrice, sellPrice, minStock, barcode, description },
      });
      await tx.inventoryItem.create({ data: { productId: created.id, quantity: 0 } });
      return created;
    });

    success(res, product, 'Product created', 201);
  })
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'categoryId', 'unit', 'costPrice', 'sellPrice', 'minStock', 'barcode', 'description', 'isActive', 'image'];
    const data = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    const product = await prisma.product.update({ where: { id: req.params.id }, data, include: productInclude });
    success(res, product, 'Product updated');
  })
);

router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: req.params.id } });
    success(res, null, 'Product deleted');
  })
);

module.exports = router;

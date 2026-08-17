const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError, asyncHandler, success, paginate } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, unread } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit || 20);
    const where = unread === 'true' ? { isRead: false } : {};

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { isRead: false } }),
    ]);

    success(res, { items, unreadCount, pagination: { page: p, limit: l, total } });
  })
);

router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const unreadCount = await prisma.notification.count({ where: { isRead: false } });
    success(res, { unreadCount });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    }).catch(() => null);
    if (!notification) throw new AppError('Notification not found', 404);
    success(res, notification);
  })
);

router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
    success(res, null, 'All notifications marked as read');
  })
);

module.exports = router;

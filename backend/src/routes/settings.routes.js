const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, success } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const settings = await prisma.setting.findMany();
    const data = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    success(res, data);
  })
);

router.put(
  '/',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const entries = Object.entries(req.body);
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );
    success(res, req.body, 'Settings updated');
  })
);

module.exports = router;

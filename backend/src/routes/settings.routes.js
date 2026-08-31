const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, success } = require('../utils/helpers');
const { parseHeroSlides } = require('../utils/siteSettings');

const router = express.Router();
router.use(authenticate);

function normalizeSettingsBody(body) {
  const data = { ...body };
  if (data.hero_slides != null && typeof data.hero_slides !== 'string') {
    data.hero_slides = JSON.stringify(data.hero_slides);
  }
  if (typeof data.hero_slides === 'string') {
    parseHeroSlides(data.hero_slides);
  }
  return data;
}

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
    const entries = Object.entries(normalizeSettingsBody(req.body));
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

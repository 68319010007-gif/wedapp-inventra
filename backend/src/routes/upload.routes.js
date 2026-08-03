const express = require('express');
const path = require('path');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, success } = require('../utils/helpers');
const config = require('../config/env');

const router = express.Router();
router.use(authenticate);

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    success(res, { filename: req.file.filename, url, path: path.join(config.uploadDir, req.file.filename) }, 'File uploaded', 201);
  })
);

module.exports = router;

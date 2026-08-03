class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const success = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

const paginate = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

const generateCode = (prefix, num) => `${prefix}-${String(num).padStart(5, '0')}`;

module.exports = { AppError, asyncHandler, success, paginate, generateCode };

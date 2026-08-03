const prisma = require('../config/database');

const auditLog = async (req, action, module, detail = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action,
        module,
        detail,
        ip: req.ip,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { auditLog };

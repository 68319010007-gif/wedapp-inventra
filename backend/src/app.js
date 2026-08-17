const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const customersRoutes = require('./routes/customers.routes');
const suppliersRoutes = require('./routes/suppliers.routes');
const categoriesRoutes = require('./routes/categories.routes');
const productsRoutes = require('./routes/products.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const salesRoutes = require('./routes/sales.routes');
const purchasesRoutes = require('./routes/purchases.routes');
const reportsRoutes = require('./routes/reports.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const settingsRoutes = require('./routes/settings.routes');
const uploadRoutes = require('./routes/upload.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const paymentsRoutes = require('./routes/payments.routes');
const storeAuthRoutes = require('./routes/storeAuth.routes');
const storeRoutes = require('./routes/store.routes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), config.uploadDir)));

const api = express.Router();

api.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Inventra API is running', version: '1.0.0' });
});

api.use('/store/auth', storeAuthRoutes);
api.use('/store', storeRoutes);
api.use('/auth', authRoutes);
api.use('/users', usersRoutes);
api.use('/customers', customersRoutes);
api.use('/suppliers', suppliersRoutes);
api.use('/categories', categoriesRoutes);
api.use('/products', productsRoutes);
api.use('/inventory', inventoryRoutes);
api.use('/sales', salesRoutes);
api.use('/purchases', purchasesRoutes);
api.use('/reports', reportsRoutes);
api.use('/dashboard', dashboardRoutes);
api.use('/settings', settingsRoutes);
api.use('/upload', uploadRoutes);
api.use('/audit-log', auditLogRoutes);
api.use('/payments', paymentsRoutes);

app.use('/api/v1', api);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

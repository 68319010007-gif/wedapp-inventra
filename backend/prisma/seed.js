const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin@1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventra.com' },
    update: {},
    create: { email: 'admin@inventra.com', password, name: 'System Admin', role: 'ADMIN' },
  });

  const categories = await Promise.all(
    ['Cement', 'Steel', 'Tiles', 'Sanitary'].map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const products = await Promise.all(
    [
      { sku: 'CEM-001', name: 'Portland Cement 50kg', sellPrice: 185, minStock: 50, category: 'Cement', description: '...' },
      { sku: 'STL-001', name: 'Steel Rebar 12mm', sellPrice: 420, minStock: 30, category: 'Steel', description: '...' },
      { sku: 'TIL-001', name: 'Ceramic Floor Tile 60x60', sellPrice: 95, minStock: 100, category: 'Tiles', description: '...' },
      { sku: 'SAN-001', name: 'Wall Hung Basin', sellPrice: 1250, minStock: 10, category: 'Sanitary', description: '...' },
    ].map(async (p) => {
      const cat = categories.find((c) => c.name === p.category);
      const product = await prisma.product.upsert({
        where: { sku: p.sku }, update: {},
        create: { sku: p.sku, name: p.name, description: p.description, sellPrice: p.sellPrice, costPrice: p.sellPrice * 0.7, minStock: p.minStock, categoryId: cat?.id },
      });
      await prisma.inventoryItem.upsert({
        where: { productId: product.id }, update: {},
        create: { productId: product.id, quantity: p.minStock + 20 },
      });
      return product;
    })
  );

  const customer = await prisma.customer.upsert({
    where: { code: 'CUS-001' }, update: {},
    create: { code: 'CUS-001', name: 'ABC Construction Co.', email: 'contact@abc.co.th', phone: '02-123-4567' },
  });

  const supplier = await prisma.supplier.upsert({
    where: { code: 'SUP-001' }, update: {},
    create: { code: 'SUP-001', name: 'BuildMart Supply', email: 'sales@buildmart.co.th', phone: '02-987-6543' },
  });

  await prisma.setting.upsert({ where: { key: 'app_name' }, update: {}, create: { key: 'app_name', value: 'Inventra' } });
  await prisma.setting.upsert({ where: { key: 'app_tagline' }, update: {}, create: { key: 'app_tagline', value: 'Smart Inventory & Sales Management System' } });

  console.log('Seed completed:', { admin: admin.email, products: products.length, customer: customer.code, supplier: supplier.code });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
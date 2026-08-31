const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function upsertCategory(name, { description, longDescription, imageUrl, parentId, sortOrder = 0 } = {}) {
  return prisma.category.upsert({
    where: { name },
    update: { description, longDescription, imageUrl, parentId, sortOrder },
    create: { name, description, longDescription, imageUrl, parentId, sortOrder },
  });
}

async function main() {
  const password = await bcrypt.hash('Admin@1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventra.com' },
    update: {},
    create: { email: 'admin@inventra.com', password, name: 'System Admin', role: 'ADMIN' },
  });

  const construction = await upsertCategory('วัสดุก่อสร้าง', {
    sortOrder: 1,
    description: 'รวมปูน อิฐ หลังคา ฉนวน และวัสดุก่อสร้างครบวงจร สำหรับงานบ้าน อาคาร และโครงการก่อสร้าง',
    longDescription: 'วัสดุก่อสร้างเป็นสิ่งจำเป็นสำหรับงานก่อสร้างทุกประเภท ตั้งแต่บ้านพักอาศัย อาคารสำนักงาน ไปจนถึงโครงการขนาดใหญ่',
  });

  const cementGroup = await upsertCategory('ปูน / วัสดุเทพื้น', {
    parentId: construction.id,
    sortOrder: 1,
    description: 'ปูนซีเมนต์ ปูนผสม ปูนมอร์ตาร์ หิน ทราย และวัสดุเทพื้นสำหรับงานก่อสร้างและปรับพื้นที่',
    longDescription: 'ปูนเป็นวัสดุก่อสร้างพื้นฐานที่ใช้ผสมกับหิน ทราย และน้ำ เพื่อสร้างคอนกรีตและปูนก่อ มีหลายประเภทตามการใช้งาน เช่น ปูนปอร์ตแลนด์ ปูนผสมสำเร็จรูป และปูนมอร์ตาร์',
  });

  const portland = await upsertCategory('ปูนปอร์ตแลนด์', {
    parentId: cementGroup.id,
    sortOrder: 1,
    description: 'ปูนปอร์ตแลนด์คุณภาพสูงสำหรับงานเทคอนกรีตและโครงสร้าง',
    longDescription: 'ปูนปอร์ตแลนด์ (Portland Cement) เป็นปูนที่ใช้กันมากที่สุด ผลิตจากการเผาและบด Clinker ผสมกับยิปซum มีความแข็งตัวเร็วและความแข็งแรงสูง เหมาะสำหรับงานเทพื้น เสา คาน และโครงสร้างคอนกรีตทั่วไป\n\nประเภทของปูนปอร์ตแลนด์\n- ปูนปอร์ตแลนด์ Type I: ใช้ทั่วไป\n- ปูนปอร์ตแลนด์ Type III: แข็งตัวเร็ว\n- ปูนปอร์ตแลนด์ชนิดพิเศษ: สำหรับงานเฉพาะทาง',
  });

  await upsertCategory('ปูนผสม ก่อ-ฉาบ', { parentId: cementGroup.id, sortOrder: 2 });
  await upsertCategory('ปูนมอร์ตาร์', { parentId: cementGroup.id, sortOrder: 3 });
  await upsertCategory('หิน ทราย', { parentId: cementGroup.id, sortOrder: 4 });

  const brickGroup = await upsertCategory('อิฐ / บล็อกปูพื้น', {
    parentId: construction.id,
    sortOrder: 2,
    description: 'อิฐมวลเบา อิฐมอญ บล็อก และวัสดุก่อผนัง',
    longDescription: 'อิฐและบล็อกปูพื้นใช้สำหรับงานก่อผนังและปูพื้น มีทั้งอิฐมวลเบา อิฐมอญ และบล็อกคอนกรีต',
  });

  const aac = await upsertCategory('อิฐมวลเบา', { parentId: brickGroup.id, sortOrder: 1 });
  const clay = await upsertCategory('อิฐมอญ', { parentId: brickGroup.id, sortOrder: 2 });
  await upsertCategory('บล็อกมวลเบา', { parentId: brickGroup.id, sortOrder: 3 });

  const steel = await upsertCategory('เหล็ก', {
    parentId: construction.id,
    sortOrder: 3,
    description: 'เหล็กเส้น เหล็กรูปพรรณ และวัสดุโครงสร้าง',
    longDescription: 'เหล็กเป็นโครงสร้างหลักของงานก่อสร้างสมัยใหม่ ช่วยรับแรงและเพิ่มความแข็งแรงให้คอนกรีต',
  });

  const tilesRoot = await upsertCategory('กระเบื้อง / อุปกรณ์', { sortOrder: 2 });
  const tiles = await upsertCategory('กระเบื้อง', { parentId: tilesRoot.id, sortOrder: 1 });

  const sanitaryRoot = await upsertCategory('สุขภัณฑ์ / ห้องน้ำ', { sortOrder: 3 });
  const sanitary = await upsertCategory('สุขภัณฑ์', { parentId: sanitaryRoot.id, sortOrder: 1 });

  for (const legacy of [
    'Cement', 'Steel', 'Tiles', 'Sanitary',
    'กระเบื้อง (Tiles)', 'ปูนซีเมนต์ (Cement)', 'เหล็ก (Steel)', 'สุขภัณฑ์ (Sanitary)',
    'ปูนซีเมนต์ / วัสดุปูพื้น',
  ]) {
    try {
      await prisma.category.delete({ where: { name: legacy } });
    } catch {
      /* not found */
    }
  }

  const products = await Promise.all(
    [
      { sku: 'CEM-001', name: 'Portland Cement 50kg', sellPrice: 185, minStock: 50, categoryId: portland.id, description: 'ปูนซีเมนต์ปอร์ตแลนด์ 50 กก.' },
      { sku: 'STL-001', name: 'Steel Rebar 12mm', sellPrice: 420, minStock: 30, categoryId: steel.id, description: 'เหล็กเส้นข้ออ้อย 12 มม.' },
      { sku: 'TIL-001', name: 'Ceramic Floor Tile 60x60', sellPrice: 95, minStock: 100, categoryId: tiles.id, description: 'กระเบื้องเซรามิก 60x60 ซม.' },
      { sku: 'SAN-001', name: 'Wall Hung Basin', sellPrice: 1250, minStock: 10, categoryId: sanitary.id, description: 'อ่างล้างหน้าแขวนผนัง' },
      { sku: 'BRK-AAC-001', name: 'อิฐมวลเบา DURAONE 7.5 ซม.', sellPrice: 26, minStock: 4400, categoryId: aac.id, description: 'อิฐมวลเบา เกรด G2 ขนาด 7.5 ซม.' },
      { sku: 'BRK-CLY-001', name: 'อิฐมอญ ตราเพชร', sellPrice: 4.5, minStock: 500, categoryId: clay.id, description: 'อิฐมอญมาตรฐาน' },
    ].map(async (p) => {
      const product = await prisma.product.upsert({
        where: { sku: p.sku },
        update: { categoryId: p.categoryId, description: p.description },
        create: {
          sku: p.sku,
          name: p.name,
          description: p.description,
          sellPrice: p.sellPrice,
          costPrice: p.sellPrice * 0.7,
          minStock: p.minStock,
          categoryId: p.categoryId,
        },
      });
      await prisma.inventoryItem.upsert({
        where: { productId: product.id },
        update: {},
        create: { productId: product.id, quantity: p.minStock + 20 },
      });
      return product;
    })
  );

  const customer = await prisma.customer.upsert({
    where: { code: 'CUS-001' },
    update: {},
    create: { code: 'CUS-001', name: 'ABC Construction Co.', email: 'contact@abc.co.th', phone: '02-123-4567' },
  });

  const supplier = await prisma.supplier.upsert({
    where: { code: 'SUP-001' },
    update: {},
    create: { code: 'SUP-001', name: 'BuildMart Supply', email: 'sales@buildmart.co.th', phone: '02-987-6543' },
  });

  await prisma.setting.upsert({ where: { key: 'app_name' }, update: {}, create: { key: 'app_name', value: 'Inventra' } });
  await prisma.setting.upsert({
    where: { key: 'app_tagline' },
    update: {},
    create: { key: 'app_tagline', value: 'Smart Inventory & Sales Management System' },
  });

  console.log('Seed completed:', { admin: admin.email, products: products.length, customer: customer.code, supplier: supplier.code });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

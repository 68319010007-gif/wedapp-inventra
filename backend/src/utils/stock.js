const { AppError } = require('./helpers');
const { emitStockUpdate } = require('../socket');

const DEDUCTING_STATUSES = ['PROCESSING', 'SHIPPING', 'COMPLETED'];

function shouldHaveStockDeducted(status) {
  return DEDUCTING_STATUSES.includes(status);
}

async function deductStock(tx, items, { reference, note, createdById } = {}) {
  const changes = [];
  for (const item of items) {
    let inv = await tx.inventoryItem.findUnique({ where: { productId: item.productId } });
    if (!inv) {
      inv = await tx.inventoryItem.create({ data: { productId: item.productId, quantity: 0 } });
    }
    if (inv.quantity < item.quantity) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      throw new AppError(`Insufficient stock for ${product?.name || item.productId}`);
    }
    const updated = await tx.inventoryItem.update({
      where: { productId: item.productId },
      data: { quantity: inv.quantity - item.quantity },
    });
    changes.push({ productId: item.productId, quantity: updated.quantity });
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'OUT',
        quantity: item.quantity,
        reference,
        note,
        createdById: createdById || null,
      },
    });
  }
  return changes;
}

async function restoreStock(tx, items, { reference, note, createdById } = {}) {
  const changes = [];
  for (const item of items) {
    const inv = await tx.inventoryItem.findUnique({ where: { productId: item.productId } });
    const newQty = (inv?.quantity ?? 0) + item.quantity;
    if (inv) {
      await tx.inventoryItem.update({
        where: { productId: item.productId },
        data: { quantity: newQty },
      });
    } else {
      await tx.inventoryItem.create({ data: { productId: item.productId, quantity: newQty } });
    }
    changes.push({ productId: item.productId, quantity: newQty });
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'IN',
        quantity: item.quantity,
        reference,
        note,
        createdById: createdById || null,
      },
    });
  }
  return changes;
}

async function assertStockAvailable(tx, items) {
  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: { inventoryItems: true },
    });
    if (!product || !product.isActive) {
      throw new AppError(`Product not available: ${item.productId}`);
    }
    const stock = product.inventoryItems?.quantity ?? 0;
    if (stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`);
    }
  }
}

function broadcastStock(changes) {
  changes.forEach(({ productId, quantity }) => emitStockUpdate(productId, quantity));
}

module.exports = {
  shouldHaveStockDeducted,
  deductStock,
  restoreStock,
  assertStockAvailable,
  broadcastStock,
};

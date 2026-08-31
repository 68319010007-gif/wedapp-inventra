function buildCategoryTree(categories) {
  const byId = new Map(categories.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];

  for (const cat of byId.values()) {
    if (cat.parentId && byId.has(cat.parentId)) {
      byId.get(cat.parentId).children.push(cat);
    } else {
      roots.push(cat);
    }
  }

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'th'));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

function getDescendantIds(categoryId, categories) {
  const byParent = new Map();
  for (const c of categories) {
    const key = c.parentId || '__root__';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c.id);
  }

  const ids = [categoryId];
  const queue = [categoryId];
  while (queue.length) {
    const current = queue.shift();
    for (const childId of byParent.get(current) || []) {
      ids.push(childId);
      queue.push(childId);
    }
  }
  return ids;
}

function getTotalProductCount(categoryId, categories) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return getDescendantIds(categoryId, categories).reduce(
    (sum, id) => sum + (byId.get(id)?._count?.products ?? 0),
    0
  );
}

function attachProductCounts(categories) {
  return categories.map((cat) => ({
    ...cat,
    productCount: getTotalProductCount(cat.id, categories),
  }));
}

function getCategoryPath(categoryId, categories) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path = [];
  let current = byId.get(categoryId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : null;
  }
  return path;
}

module.exports = {
  buildCategoryTree,
  getDescendantIds,
  getCategoryPath,
  getTotalProductCount,
  attachProductCounts,
};

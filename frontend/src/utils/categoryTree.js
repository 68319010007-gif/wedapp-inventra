export function buildCategoryTree(categories) {
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

export function flattenCategoryTree(tree, depth = 0) {
  const out = [];
  for (const node of tree) {
    out.push({ ...node, depth });
    if (node.children?.length) out.push(...flattenCategoryTree(node.children, depth + 1));
  }
  return out;
}

export function getCategoryPath(categoryId, categories) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path = [];
  let current = categoryId ? byId.get(categoryId) : null;
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : null;
  }
  return path;
}

export function getCategoryPathFromProduct(category) {
  if (!category) return [];
  const path = [];
  let current = category;
  while (current) {
    path.unshift(current);
    current = current.parent || null;
  }
  return path;
}

export function findCategoryNode(categoryId, tree) {
  if (!categoryId) return null;
  for (const node of tree) {
    if (node.id === categoryId) return node;
    const found = findCategoryNode(categoryId, node.children || []);
    if (found) return found;
  }
  return null;
}

export function getDirectChildren(categoryId, categories) {
  return categories
    .filter((c) => c.parentId === categoryId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'th'));
}

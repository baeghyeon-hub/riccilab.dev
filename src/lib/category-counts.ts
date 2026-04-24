export type CategorizedItem = {
  categoryId: string | null;
};

export function countClassifiedItems<T extends CategorizedItem>(
  items: T[]
): number {
  return items.filter((item) => item.categoryId).length;
}

export function countItemsInCategoryIds<T extends CategorizedItem>(
  items: T[],
  categoryIds: Iterable<string>
): number {
  const idSet =
    categoryIds instanceof Set ? categoryIds : new Set(categoryIds);

  return items.filter(
    (item) => item.categoryId && idSet.has(item.categoryId)
  ).length;
}

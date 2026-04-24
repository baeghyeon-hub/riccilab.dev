import {
  collectSubtreeIds,
  type CategoryNode,
} from "@/lib/categories";

export interface CategoryDetailItem {
  categoryId: string | null;
}

export interface CategoryBreadcrumb {
  seg: string;
  href: string;
  isLast: boolean;
}

export function buildCategoryCrumbs(
  categoryBasePath: string,
  slug: string[]
): CategoryBreadcrumb[] {
  return slug.map((seg, i) => ({
    seg,
    href: `${categoryBasePath}/${slug.slice(0, i + 1).join("/")}`,
    isLast: i === slug.length - 1,
  }));
}

export function getItemsInCategorySubtree<T extends CategoryDetailItem>(
  items: T[],
  node: CategoryNode
): T[] {
  const subtreeIds = collectSubtreeIds(node);
  return items.filter(
    (item) => item.categoryId && subtreeIds.includes(item.categoryId)
  );
}

export function sortItemsByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date > b.date ? -1 : 1));
}

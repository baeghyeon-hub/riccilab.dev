import assert from "node:assert/strict";
import test from "node:test";
import type { CategoryNode } from "../src/lib/categories";
import {
  buildCategoryCrumbs,
  getItemsInCategorySubtree,
  sortItemsByDateDesc,
} from "../src/lib/category-detail";

const childNode: CategoryNode = {
  id: "child",
  name: "Child",
  slug: "child",
  parentId: "root",
  order: 2,
  description: "",
  scope: ["blog"],
  published: true,
  children: [],
  path: ["root", "child"],
  pathIds: ["root", "child"],
};

const rootNode: CategoryNode = {
  id: "root",
  name: "Root",
  slug: "root",
  parentId: null,
  order: 1,
  description: "",
  scope: ["blog"],
  published: true,
  children: [childNode],
  path: ["root"],
  pathIds: ["root"],
};

test("buildCategoryCrumbs creates cumulative category links", () => {
  assert.deepEqual(buildCategoryCrumbs("/blog/categories", ["root", "child"]), [
    {
      seg: "root",
      href: "/blog/categories/root",
      isLast: false,
    },
    {
      seg: "child",
      href: "/blog/categories/root/child",
      isLast: true,
    },
  ]);
});

test("getItemsInCategorySubtree preserves truthy categoryId filtering", () => {
  const items = [
    { slug: "root-entry", categoryId: "root" },
    { slug: "child-entry", categoryId: "child" },
    { slug: "sibling-entry", categoryId: "sibling" },
    { slug: "uncategorized", categoryId: null },
    { slug: "empty-category", categoryId: "" },
  ];

  assert.deepEqual(
    getItemsInCategorySubtree(items, rootNode).map((item) => item.slug),
    ["root-entry", "child-entry"]
  );
});

test("sortItemsByDateDesc keeps the current descending date comparator", () => {
  const items = [
    { slug: "old", date: "2024-01-01" },
    { slug: "new", date: "2024-03-01" },
    { slug: "middle", date: "2024-02-01" },
  ];

  assert.deepEqual(sortItemsByDateDesc(items).map((item) => item.slug), [
    "new",
    "middle",
    "old",
  ]);
  assert.deepEqual(items.map((item) => item.slug), ["old", "new", "middle"]);
});

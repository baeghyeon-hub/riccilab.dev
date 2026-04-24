import assert from "node:assert/strict";
import test from "node:test";
import {
  countClassifiedItems,
  countItemsInCategoryIds,
} from "../src/lib/category-counts";

const items = [
  { slug: "root-entry", categoryId: "root" },
  { slug: "child-entry", categoryId: "child" },
  { slug: "sibling-entry", categoryId: "sibling" },
  { slug: "uncategorized", categoryId: null },
  { slug: "empty-category", categoryId: "" },
];

test("countClassifiedItems preserves truthy categoryId semantics", () => {
  assert.equal(countClassifiedItems(items), 3);
});

test("countItemsInCategoryIds counts only ids in the selected subtree", () => {
  assert.equal(countItemsInCategoryIds(items, ["root", "child"]), 2);
  assert.equal(countItemsInCategoryIds(items, ["missing"]), 0);
});

test("countItemsInCategoryIds accepts prebuilt id sets", () => {
  assert.equal(countItemsInCategoryIds(items, new Set(["child", "sibling"])), 2);
});

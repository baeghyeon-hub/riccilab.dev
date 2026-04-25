import assert from "node:assert/strict";
import test from "node:test";
import type {
  PageObjectResponse,
  QueryDataSourceResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {
  getCheckboxValue,
  getDateStart,
  getMultiSelectNames,
  getNumberValue,
  getRelationIds,
  getRichText,
  getSelectName,
  getTitleText,
  getUrlValue,
  requireFullPage,
  type NotionPageProperties,
} from "../src/lib/notion-properties";

function asProperties(
  properties: Record<string, unknown>
): NotionPageProperties {
  return properties as unknown as NotionPageProperties;
}

test("notion property getters preserve existing fallback semantics", () => {
  const properties = asProperties({
    Title: { type: "title", title: [{ plain_text: "Post title" }] },
    EmptySlug: { type: "rich_text", rich_text: [{ plain_text: "" }] },
    Description: {
      type: "rich_text",
      rich_text: [{ plain_text: "Summary" }],
    },
    Category: {
      type: "relation",
      relation: [{ id: "category-id" }],
    },
    Order: { type: "number", number: 0 },
    Published: { type: "checkbox", checkbox: false },
    Date: { type: "date", date: { start: "2026-04-25" } },
    Tags: {
      type: "multi_select",
      multi_select: [{ name: "ts" }, { name: "next" }],
    },
    Status: { type: "select", select: { name: "Active" } },
    Link: { type: "url", url: null },
    GitHub: { type: "url", url: "https://github.com/example/repo" },
  });

  assert.equal(getTitleText(properties, "Title"), "Post title");
  assert.equal(getRichText(properties, "EmptySlug"), "");
  assert.equal(getRichText(properties, "Description"), "Summary");
  assert.deepEqual(getRelationIds(properties, "Category"), ["category-id"]);
  assert.equal(getNumberValue(properties, "Order"), 0);
  assert.equal(getCheckboxValue(properties, "Published"), false);
  assert.equal(getDateStart(properties, "Date"), "2026-04-25");
  assert.deepEqual(getMultiSelectNames(properties, "Tags"), ["ts", "next"]);
  assert.equal(getSelectName(properties, "Status"), "Active");
  assert.equal(getUrlValue(properties, "Link"), undefined);
  assert.equal(
    getUrlValue(properties, "GitHub"),
    "https://github.com/example/repo"
  );
});

test("notion property getters return undefined or empty arrays for missing fields", () => {
  const properties = asProperties({});

  assert.equal(getTitleText(properties, "Title"), undefined);
  assert.equal(getRichText(properties, "Slug"), undefined);
  assert.deepEqual(getRelationIds(properties, "Category"), []);
  assert.equal(getNumberValue(properties, "Order"), undefined);
  assert.equal(getCheckboxValue(properties, "Published"), undefined);
  assert.equal(getDateStart(properties, "Date"), undefined);
  assert.deepEqual(getMultiSelectNames(properties, "Tags"), []);
  assert.equal(getSelectName(properties, "Status"), undefined);
  assert.equal(getUrlValue(properties, "Link"), undefined);
});

test("requireFullPage keeps query mapping failures explicit", () => {
  const fullPage = {
    object: "page",
    id: "page-id",
    properties: asProperties({}),
  } as PageObjectResponse;
  const partialPage = {
    object: "page",
    id: "partial-page-id",
  } as QueryDataSourceResponse["results"][number];

  assert.equal(requireFullPage(fullPage).id, "page-id");
  assert.throws(
    () => requireFullPage(partialPage),
    /Expected Notion data source query to return a full page/
  );
});

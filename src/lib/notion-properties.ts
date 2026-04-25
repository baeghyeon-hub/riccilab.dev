import type {
  PageObjectResponse,
  QueryDataSourceResponse,
} from "@notionhq/client/build/src/api-endpoints";

export type NotionDataSourceResult =
  QueryDataSourceResponse["results"][number];
export type NotionPageProperties = PageObjectResponse["properties"];

export function requireFullPage(
  result: NotionDataSourceResult
): PageObjectResponse {
  if (result.object === "page" && "properties" in result) {
    return result;
  }

  throw new Error(
    `Expected Notion data source query to return a full page, received ${result.object}`
  );
}

export function getTitleText(
  properties: NotionPageProperties,
  key: string
): string | undefined {
  const property = properties[key];
  return property?.type === "title"
    ? property.title[0]?.plain_text
    : undefined;
}

export function getRichText(
  properties: NotionPageProperties,
  key: string
): string | undefined {
  const property = properties[key];
  return property?.type === "rich_text"
    ? property.rich_text[0]?.plain_text
    : undefined;
}

export function getRelationIds(
  properties: NotionPageProperties,
  key: string
): string[] {
  const property = properties[key];
  return property?.type === "relation"
    ? property.relation.map((relation) => relation.id)
    : [];
}

export function getNumberValue(
  properties: NotionPageProperties,
  key: string
): number | undefined {
  const property = properties[key];
  return property?.type === "number" ? property.number ?? undefined : undefined;
}

export function getCheckboxValue(
  properties: NotionPageProperties,
  key: string
): boolean | undefined {
  const property = properties[key];
  return property?.type === "checkbox" ? property.checkbox : undefined;
}

export function getDateStart(
  properties: NotionPageProperties,
  key: string
): string | undefined {
  const property = properties[key];
  return property?.type === "date" ? property.date?.start : undefined;
}

export function getMultiSelectNames(
  properties: NotionPageProperties,
  key: string
): string[] {
  const property = properties[key];
  return property?.type === "multi_select"
    ? property.multi_select.map((option) => option.name)
    : [];
}

export function getSelectName(
  properties: NotionPageProperties,
  key: string
): string | undefined {
  const property = properties[key];
  return property?.type === "select" ? property.select?.name : undefined;
}

export function getUrlValue(
  properties: NotionPageProperties,
  key: string
): string | undefined {
  const property = properties[key];
  return property?.type === "url" ? property.url ?? undefined : undefined;
}

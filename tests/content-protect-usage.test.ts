import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("project detail content remains wrapped with ContentProtect", () => {
  const source = readFileSync("src/app/projects/[slug]/page.tsx", "utf8");

  assert.match(
    source,
    /import \{ ContentProtect \} from "@\/components\/blog\/ContentProtect";/
  );
  assert.match(source, /<ContentProtect>\s*\{await renderProjectContent/);
});

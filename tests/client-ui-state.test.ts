import assert from "node:assert/strict";
import test from "node:test";
import {
  getGiscusThemeUrl,
  getLandingStageFromVisited,
  getNextThemeMode,
  themeModeFromClassName,
} from "../src/lib/client-ui-state";

test("themeModeFromClassName detects the dark class token only", () => {
  assert.equal(themeModeFromClassName("dark"), "dark");
  assert.equal(themeModeFromClassName("foo dark bar"), "dark");
  assert.equal(themeModeFromClassName("dark-mode"), "light");
  assert.equal(themeModeFromClassName(""), "light");
});

test("getNextThemeMode mirrors the existing toggle behavior", () => {
  assert.equal(getNextThemeMode("dark"), "light");
  assert.equal(getNextThemeMode("light"), "dark");
});

test("getGiscusThemeUrl preserves the theme asset paths", () => {
  assert.equal(
    getGiscusThemeUrl("https://riccilab.dev", "dark"),
    "https://riccilab.dev/giscus-theme.css"
  );
  assert.equal(
    getGiscusThemeUrl("https://riccilab.dev", "light"),
    "https://riccilab.dev/giscus-theme-light.css"
  );
});

test("getLandingStageFromVisited preserves the loader gate semantics", () => {
  assert.equal(getLandingStageFromVisited(null), "loader");
  assert.equal(getLandingStageFromVisited(""), "loader");
  assert.equal(getLandingStageFromVisited("1"), "loaded");
});

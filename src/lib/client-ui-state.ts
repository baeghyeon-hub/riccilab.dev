import { useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark";
export type LandingStage = "checking" | "loader" | "loaded";

const subscribeNoop = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;
const getServerThemeSnapshot = (): ThemeMode => "light";

export function themeModeFromClassName(className: string): ThemeMode {
  return className.split(/\s+/).includes("dark") ? "dark" : "light";
}

export function getNextThemeMode(mode: ThemeMode): ThemeMode {
  return mode === "dark" ? "light" : "dark";
}

export function getGiscusThemeUrl(origin: string, mode: ThemeMode): string {
  return `${origin}/${mode === "dark" ? "giscus-theme.css" : "giscus-theme-light.css"}`;
}

export function getLandingStageFromVisited(
  visited: string | null
): LandingStage {
  return visited ? "loaded" : "loader";
}

export function useClientMounted(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    getMountedSnapshot,
    getServerMountedSnapshot
  );
}

function getDocumentThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return themeModeFromClassName(document.documentElement.className);
}

function subscribeToDocumentTheme(onStoreChange: () => void): () => void {
  if (
    typeof document === "undefined" ||
    typeof MutationObserver === "undefined"
  ) {
    return () => {};
  }

  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function useDocumentThemeMode(): ThemeMode {
  return useSyncExternalStore(
    subscribeToDocumentTheme,
    getDocumentThemeSnapshot,
    getServerThemeSnapshot
  );
}

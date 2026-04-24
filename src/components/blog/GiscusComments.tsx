"use client";

import Giscus from "@giscus/react";
import {
  getGiscusThemeUrl,
  useClientMounted,
  useDocumentThemeMode,
} from "@/lib/client-ui-state";

export function GiscusComments() {
  const mounted = useClientMounted();
  const themeMode = useDocumentThemeMode();
  const theme = mounted
    ? getGiscusThemeUrl(window.location.origin, themeMode)
    : null;

  return (
    <section className="max-w-3xl mx-auto mt-16">
      <div className="border-t border-border pt-12">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
            &gt; comments
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        {theme && (
          <Giscus
            repo="baeghyeon-hub/riccilab.dev"
            repoId="R_kgDOR2_IEg"
            category="General"
            categoryId="DIC_kwDOR2_IEs4C59ID"
            mapping="pathname"
            strict="0"
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="top"
            theme={theme}
            lang="en"
            loading="lazy"
          />
        )}
      </div>
    </section>
  );
}

"use client";

import Giscus from "@giscus/react";
import { useEffect, useState } from "react";

export function GiscusComments() {
  const [theme, setTheme] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? `${origin}/giscus-theme.css` : `${origin}/giscus-theme-light.css`);

    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      setTheme(dark ? `${origin}/giscus-theme.css` : `${origin}/giscus-theme-light.css`);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="max-w-3xl mx-auto mt-16">
      <div className="border-t border-border pt-12">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
            &gt; comments
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
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
      </div>
    </section>
  );
}

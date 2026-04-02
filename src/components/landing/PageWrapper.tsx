"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader } from "./Loader";
import { Navigation } from "@/components/layout/Navigation";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { Projects } from "./Projects";
import { Notes } from "./Notes";
import { Footer } from "@/components/ui/Footer";
import type { BlogPost } from "@/lib/blog";

export function PageWrapper({ posts }: { posts: BlogPost[] }) {
  const [stage, setStage] = useState<"checking" | "loader" | "loaded">("checking");

  useEffect(() => {
    const visited = sessionStorage.getItem("riccilab-visited");
    if (!visited) {
      setStage("loader");
    } else {
      setStage("loaded");
    }
  }, []);

  const handleComplete = useCallback(() => {
    sessionStorage.setItem("riccilab-visited", "1");
    setStage("loaded");
  }, []);

  return (
    <div className={stage === "checking" ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
      {stage === "loader" && <Loader onComplete={handleComplete} />}
      <div className={stage === "loaded" ? "" : "overflow-hidden h-screen pointer-events-none"}>
        <Navigation />
        <Hero />
        <Marquee />
        <Projects />
        <Notes posts={posts} />
        <Footer />
      </div>
    </div>
  );
}

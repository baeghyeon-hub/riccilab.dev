"use client";

import { useState, useCallback } from "react";
import { Loader } from "./Loader";
import { Navigation } from "@/components/layout/Navigation";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { Projects } from "./Projects";
import { Notes } from "./Notes";
import { Footer } from "@/components/ui/Footer";
import {
  getLandingStageFromVisited,
  useClientMounted,
} from "@/lib/client-ui-state";
import type { BlogPost } from "@/lib/blog";
import type { Project } from "@/lib/projects";

export function PageWrapper({ posts, projects }: { posts: BlogPost[]; projects: Project[] }) {
  const mounted = useClientMounted();
  const [completed, setCompleted] = useState(false);
  const stage = completed
    ? "loaded"
    : mounted
    ? getLandingStageFromVisited(sessionStorage.getItem("riccilab-visited"))
    : "checking";

  const handleComplete = useCallback(() => {
    sessionStorage.setItem("riccilab-visited", "1");
    setCompleted(true);
  }, []);

  return (
    <div className={stage === "checking" ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
      {stage === "loader" && <Loader onComplete={handleComplete} />}
      <div className={stage === "loaded" ? "" : "overflow-hidden h-screen pointer-events-none"}>
        <Navigation />
        <Hero />
        <Marquee />
        <Projects projects={projects} />
        <Notes posts={posts} />
        <Footer />
      </div>
    </div>
  );
}

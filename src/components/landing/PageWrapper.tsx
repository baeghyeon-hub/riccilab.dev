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
  const [showLoader, setShowLoader] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const visited = sessionStorage.getItem("riccilab-visited");
    if (!visited) {
      setShowLoader(true);
    } else {
      setLoaded(true);
    }
  }, []);

  const handleComplete = useCallback(() => {
    sessionStorage.setItem("riccilab-visited", "1");
    setLoaded(true);
  }, []);

  return (
    <>
      {showLoader && <Loader onComplete={handleComplete} />}
      <div className={loaded ? "" : "overflow-hidden h-screen"}>
        <Navigation />
        <Hero />
        <Marquee />
        <Projects />
        <Notes posts={posts} />
        <Footer />
      </div>
    </>
  );
}

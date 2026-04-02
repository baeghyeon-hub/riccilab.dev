"use client";

import { gsap } from "@/lib/gsap";

export function ThemeGlitchFilter() {
  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none', zIndex: -1 }}>
        <defs>
          <filter id="theme-glitch" x="-20%" y="-20%" width="140%" height="140%">
            {/* Split RGB Channels */}
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" in="SourceGraphic" result="RED" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" in="SourceGraphic" result="GREEN" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" in="SourceGraphic" result="BLUE" />

            {/* Offsets for Chromatic Aberration */}
            <feOffset dx="0" dy="0" in="RED" result="RED_OFFSET" className="glitch-red" />
            <feOffset dx="0" dy="0" in="GREEN" result="GREEN_OFFSET" className="glitch-green" />
            <feOffset dx="0" dy="0" in="BLUE" result="BLUE_OFFSET" className="glitch-blue" />

            {/* Merge back */}
            <feBlend mode="screen" in="RED_OFFSET" in2="GREEN_OFFSET" result="RG" />
            <feBlend mode="screen" in="RG" in2="BLUE_OFFSET" result="RGB" />

            {/* Horizontal Tearing & Noise */}
            <feTurbulence type="fractalNoise" baseFrequency="0.001 0.4" numOctaves="1" result="NOISE" />
            <feDisplacementMap in="RGB" in2="NOISE" scale="0" xChannelSelector="R" yChannelSelector="G" className="glitch-disp" />
          </filter>
        </defs>
      </svg>
      {/* Noise Overlay that flashes during transition */}
      <div 
        className="glitch-noise-overlay fixed inset-0 z-[99999] pointer-events-none mix-blend-difference hidden opacity-0"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          backgroundSize: '150px 150px'
        }}
      />
    </>
  );
}

export const triggerThemeGlitch = (callback: () => void) => {
  const red = document.querySelector(".glitch-red");
  const green = document.querySelector(".glitch-green");
  const blue = document.querySelector(".glitch-blue");
  const disp = document.querySelector(".glitch-disp");
  const overlay = document.querySelector(".glitch-noise-overlay");

  if (!red || !blue || !disp) {
    callback();
    return;
  }

  // Remove CSS smooth transitions to make the dark mode swap instant
  document.body.classList.remove("transition-colors", "duration-500");
  
  // Apply our powerful SVG filter globally
  document.body.style.filter = "url('#theme-glitch')";
  if (overlay) {
    overlay.classList.remove("hidden");
  }

  const tl = gsap.timeline({
    onComplete: () => {
      document.body.style.filter = "";
      // Restore smooth colors for normal navigation
      document.body.classList.add("transition-colors", "duration-500");
      gsap.set([red, blue, green], { attr: { dx: 0 } });
      gsap.set(disp, { attr: { scale: 0 } });
      if (overlay) {
        overlay.classList.add("hidden");
        gsap.set(overlay, { opacity: 0 });
      }
    }
  });

  // Play a very aggressive 0.3s glitch animation
  if (overlay) {
    tl.to(overlay, { opacity: 0.15, duration: 0.05, ease: "steps(2)" }, 0)
      .to(overlay, { opacity: 0.4, duration: 0.05, ease: "steps(2)" }, 0.05)
      .to(overlay, { opacity: 0, duration: 0.1, ease: "power2.out" }, 0.15);
  }

  tl.to(red, { attr: { dx: 25 }, duration: 0.05, ease: "steps(2)" }, 0)
    .to(blue, { attr: { dx: -25 }, duration: 0.05, ease: "steps(2)" }, 0)
    .to(disp, { attr: { scale: 80 }, duration: 0.05, ease: "steps(2)" }, 0)

    .to(red, { attr: { dx: -45 }, duration: 0.05, ease: "steps(2)" }, 0.05)
    .to(blue, { attr: { dx: 45 }, duration: 0.05, ease: "steps(2)" }, 0.05)
    .to(green, { attr: { dx: 15 }, duration: 0.05, ease: "steps(2)" }, 0.05)
    .to(disp, { attr: { scale: 150 }, duration: 0.05, ease: "steps(2)" }, 0.05)

    .call(() => {
      // Execute the actual theme swap exactly at the peak of the glitch
      callback();
    }, [], 0.08)

    .to(red, { attr: { dx: 15 }, duration: 0.05, ease: "steps(2)" }, 0.1)
    .to(blue, { attr: { dx: -10 }, duration: 0.05, ease: "steps(2)" }, 0.1)
    .to(green, { attr: { dx: -5 }, duration: 0.05, ease: "steps(2)" }, 0.1)
    .to(disp, { attr: { scale: 40 }, duration: 0.05, ease: "steps(2)" }, 0.1)
    
    .to([red, blue, green], { attr: { dx: 0 }, duration: 0.15, ease: "power3.out" }, 0.15)
    .to(disp, { attr: { scale: 0 }, duration: 0.15, ease: "power3.out" }, 0.15);
};

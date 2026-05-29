"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Determine if user has requested reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return; // Skip smooth scrolling if reduced motion is requested
    }

    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.4, // Extended duration for ultra-fluid, cinematic scroll feeling
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Elegant exponential out curve
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2, // Controlled touch response for mobile
    });

    // 2. Synchronize ScrollTrigger with Lenis
    lenis.on("scroll", ScrollTrigger.update);

    // 3. Connect GSAP Ticker to Lenis RequestAnimationFrame (RAF)
    const tickHandler = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickHandler);
    gsap.ticker.lagSmoothing(0);

    // 4. Performance & Mobile Overrides
    // To resolve GSAP + ScrollTrigger instabilties on mobile caused by
    // the dynamic height shifts of mobile browsers' address/URL bar:
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    ScrollTrigger.config({
      ignoreMobileResize: true, // Prevents ScrollTrigger from recalculating positions on address bar resize
    });

    if (isMobile) {
      // Normalize scroll on mobile: intercepts touch events and channels them
      // through GSAP's scroll handler to prevent jank and layout shifts
      ScrollTrigger.normalizeScroll({
        allowNestedScroll: true,
      });
      
      // Keep refresh events to a minimum to avoid jank on mobile scroll inertia
      ScrollTrigger.addEventListener("refreshInit", () => {
        // Any custom optimization prior to refresh
      });
    }

    // Export lenis globally for any scroll-hijacks or anchors
    (window as any).lenis = lenis;

    // 5. Cleanup on unmount to avoid memory leaks
    return () => {
      gsap.ticker.remove(tickHandler);
      lenis.destroy();
      ScrollTrigger.killAll();
      delete (window as any).lenis;
    };
  }, []);

  return (
    <div ref={scrollContainerRef} className="relative w-full">
      {children}
    </div>
  );
}

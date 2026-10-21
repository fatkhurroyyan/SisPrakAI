"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./NavigationProgressBar.module.css";

function NavigationProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress bar when route transition finishes
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept link clicks to provide immediate 0ms visual feedback
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Skip external links, anchors, new tabs, modifier keys
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Skip same-page clicks
      const currentPath = window.location.pathname;
      if (href === currentPath || href === window.location.pathname + window.location.search) {
        return;
      }

      // Start the progress immediately
      setIsNavigating(true);
      setProgress(30);

      clearTimeout(timer1);
      clearTimeout(timer2);

      timer1 = setTimeout(() => {
        setProgress((prev) => (prev < 65 ? 65 : prev));
      }, 180);

      timer2 = setTimeout(() => {
        setProgress((prev) => (prev < 88 ? 88 : prev));
      }, 600);
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className={styles.progressContainer}>
      <div
        className={styles.progressBar}
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition:
            progress === 100
              ? "width 0.2s ease-out, opacity 0.3s ease-out 0.1s"
              : "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className={styles.progressGlow} />
      </div>
    </div>
  );
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarContent />
    </Suspense>
  );
}

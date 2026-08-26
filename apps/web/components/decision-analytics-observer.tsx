"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordDecisionClientEvent } from "@/components/decision-event";

function repositoryFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/repos\/([^/]+)\/([^/]+)$/);
  return match ? `${decodeURIComponent(match[1])}/${decodeURIComponent(match[2])}` : null;
}

export function DecisionAnalyticsObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.dataset.decisionTracked === "true") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      if (pathname === "/compare") {
        const repositoryFullName = repositoryFromPath(url.pathname);
        if (repositoryFullName) {
          recordDecisionClientEvent({
            eventType: "compare_repository_open",
            sourceSurface: "compare",
            repositoryFullName,
          });
          return;
        }
        if (/^\/repos\/[^/]+\/[^/]+\/blueprint$/.test(url.pathname)) {
          recordDecisionClientEvent({
            eventType: "compare_blueprint",
            sourceSurface: "compare",
          });
        }
      }

      if (pathname === "/ideas" && /^\/ideas\/[^/]+$/.test(url.pathname)) {
        recordDecisionClientEvent({
          eventType: "build_idea_open",
          sourceSurface: "build",
        });
      }
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname]);

  return null;
}

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function TopLoadingBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const activeRef = useRef(false);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const routeKeyRef = useRef(routeKey);

  useEffect(() => {
    function shouldTrackClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) {
        return false;
      }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return false;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return false;
      }

      const anchor = target.closest("a");
      if (anchor instanceof HTMLAnchorElement) {
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
          return false;
        }
        if (anchor.target && anchor.target !== "_self") {
          return false;
        }
        if (anchor.hasAttribute("download")) {
          return false;
        }

        try {
          const url = new URL(anchor.href, window.location.href);
          if (url.origin !== window.location.origin) {
            return false;
          }
          if (`${url.pathname}${url.search}` === `${window.location.pathname}${window.location.search}`) {
            return false;
          }
        } catch {
          return false;
        }

        return true;
      }

      const button = target.closest("button");
      if (button instanceof HTMLButtonElement) {
        return button.type === "submit";
      }

      return false;
    }

    let safetyTimer = 0;

    function start() {
      activeRef.current = true;
      setVisible(true);
      setWidth(18);
      window.clearTimeout(safetyTimer);
      safetyTimer = window.setTimeout(() => {
        if (!activeRef.current) {
          return;
        }
        activeRef.current = false;
        setVisible(false);
        setWidth(0);
      }, 8000);
    }

    function onClick(event: MouseEvent) {
      if (shouldTrackClick(event)) {
        start();
      }
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (!visible || !activeRef.current) {
      return;
    }

    const id = window.setInterval(() => {
      setWidth((current) => {
        if (current >= 88) {
          return current;
        }
        return current + Math.max(1.5, (88 - current) * 0.08);
      });
    }, 120);

    return () => window.clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (routeKeyRef.current === routeKey) {
      return;
    }
    routeKeyRef.current = routeKey;

    if (!activeRef.current) {
      return;
    }

    setWidth(100);
    const done = window.setTimeout(() => {
      activeRef.current = false;
      setVisible(false);
      setWidth(0);
    }, 220);

    return () => window.clearTimeout(done);
  }, [routeKey]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-[60] h-[2px] overflow-hidden">
      <div
        className="h-full bg-[#109e44] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarInner />
    </Suspense>
  );
}

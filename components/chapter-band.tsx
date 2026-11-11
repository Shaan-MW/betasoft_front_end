"use client";

import { useEffect, useRef, useState } from "react";

const items = ["A/L ICT Chapters", "O/L ICT Chapters"] as const;

const NORMAL_SPEED = 0.55;
const HOVER_SPEED = 0.1;

function MarqueeSegment({ copies = 12 }: { copies?: number }) {
  const sequence = Array.from({ length: copies }, (_, index) => items[index % items.length]);

  return (
    <div className="flex shrink-0 items-center gap-8 px-4" data-marquee-segment="true">
      {sequence.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center gap-8 whitespace-nowrap">
          <span className="text-sm font-bold tracking-wide text-white sm:text-base">{item}</span>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

export function ChapterBand() {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const speedRef = useRef(NORMAL_SPEED);
  const targetSpeedRef = useRef(NORMAL_SPEED);
  const segmentWidthRef = useRef(0);
  const [pausedForMotion, setPausedForMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function syncMotion() {
      setPausedForMotion(media.matches);
      targetSpeedRef.current = media.matches ? 0 : NORMAL_SPEED;
      speedRef.current = media.matches ? 0 : NORMAL_SPEED;
    }
    syncMotion();
    media.addEventListener("change", syncMotion);
    return () => media.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    function measure() {
      const segment = track?.querySelector<HTMLElement>("[data-marquee-segment='true']");
      if (!segment) {
        return;
      }
      segmentWidthRef.current = segment.offsetWidth;
      if (offsetRef.current === 0) {
        offsetRef.current = -segmentWidthRef.current;
        track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (pausedForMotion) {
      return;
    }

    let frame = 0;

    function tick() {
      const track = trackRef.current;
      const loopWidth = segmentWidthRef.current;

      if (!track || loopWidth <= 0) {
        frame = requestAnimationFrame(tick);
        return;
      }

      speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.06;
      offsetRef.current += speedRef.current;

      while (offsetRef.current >= 0) {
        offsetRef.current -= loopWidth;
      }
      while (offsetRef.current < -loopWidth) {
        offsetRef.current += loopWidth;
      }

      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pausedForMotion]);

  return (
    <section
      className="w-full overflow-hidden bg-[#f37021] py-3"
      aria-label="A/L and O/L ICT chapters"
      onMouseEnter={() => {
        if (!pausedForMotion) {
          targetSpeedRef.current = HOVER_SPEED;
        }
      }}
      onMouseLeave={() => {
        if (!pausedForMotion) {
          targetSpeedRef.current = NORMAL_SPEED;
        }
      }}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        <MarqueeSegment />
        <MarqueeSegment />
        <MarqueeSegment />
      </div>
    </section>
  );
}

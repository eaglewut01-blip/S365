"use client";

import { useEffect, useRef } from "react";

// A silent teaser: plays only the first few seconds of a clip in a loop, and
// only while it is on screen. Visitors who ask for reduced motion see the
// still frame instead.
export function ClipPreview({
  src,
  poster,
  seconds = 4,
  className,
}: {
  src: string;
  poster?: string;
  seconds?: number;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const restart = () => {
      if (video.currentTime >= seconds) video.currentTime = 0;
    };
    video.addEventListener("timeupdate", restart);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 }
    );
    observer.observe(video);

    return () => {
      video.removeEventListener("timeupdate", restart);
      observer.disconnect();
    };
  }, [seconds]);

  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" className={className} />;
}

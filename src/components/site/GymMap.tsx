"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Free vector tiles from OpenFreeMap (OpenStreetMap data); no API key needed.
const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

// Tilted 3D map centred on the gym. The map library is large, so it is only
// downloaded when this block is about to scroll into view.
export function GymMap({
  lat,
  lng,
  label,
  fallbackHref,
}: {
  lat: number;
  lng: number;
  label: string;
  fallbackHref: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "ready" | "failed">("idle");

  useEffect(() => {
    const el = container.current;
    if (!el) return;

    let map: MapLibreMap | undefined;
    let cancelled = false;
    let frame = 0;

    const start = async () => {
      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled) return;

        const m = new maplibregl.Map({
          container: el,
          style: STYLE_URL,
          center: [lng, lat],
          zoom: 16.3,
          pitch: 60,
          bearing: -24,
          maxPitch: 75,
          // Page scroll stays in control: zooming needs Ctrl + scroll or two fingers.
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        map = m;
        m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

        const pin = document.createElement("div");
        pin.className = "gym-pin";
        pin.innerHTML = "<b></b><i></i>";
        pin.firstElementChild!.textContent = label;
        new maplibregl.Marker({ element: pin, anchor: "bottom" }).setLngLat([lng, lat]).addTo(m);

        m.on("load", () => {
          // The stock dark style is almost black on black; lift roads and labels so streets read at a glance.
          for (const layer of m.getStyle().layers) {
            const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
            if (layer.type === "line" && sourceLayer === "transportation" && !layer.id.includes("casing")) {
              m.setPaintProperty(layer.id, "line-color", "#4c4c55");
            }
            if (layer.type === "symbol") {
              m.setPaintProperty(layer.id, "text-color", "#c9c7bf");
              m.setPaintProperty(layer.id, "text-halo-color", "#0a0a0b");
            }
          }

          // Raise the building footprints into blocks, underneath the street labels.
          const firstLabel = m.getStyle().layers.find((layer) => layer.type === "symbol")?.id;
          m.addLayer(
            {
              id: "buildings-3d",
              type: "fill-extrusion",
              source: "openmaptiles",
              "source-layer": "building",
              minzoom: 14,
              paint: {
                "fill-extrusion-color": "#5a5a66",
                "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
                "fill-extrusion-opacity": 0.92,
              },
            },
            firstLabel
          );
          setState("ready");

          // Slow turn around the gym until the visitor touches the map.
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          let turning = true;
          const stop = () => {
            turning = false;
          };
          (["mousedown", "touchstart", "wheel", "dragstart"] as const).forEach((event) => m.once(event, stop));
          const turn = () => {
            if (!turning || cancelled) return;
            m.setBearing(m.getBearing() + 0.04);
            frame = requestAnimationFrame(turn);
          };
          frame = requestAnimationFrame(turn);
        });
      } catch {
        if (!cancelled) setState("failed");
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      map?.remove();
    };
  }, [lat, lng, label]);

  return (
    <div className="relative h-[380px] overflow-hidden rounded-[3px] bg-[#111112] lg:h-[520px]">
      {/* The map library forces position: relative on this element, so it is sized by height, not inset. */}
      <div ref={container} role="region" aria-label="แผนที่ 3 มิติแสดงตำแหน่งยิม" className="h-full w-full" />
      {state !== "ready" && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center font-light text-text-lo">
          {state === "failed" ? (
            <span className="pointer-events-auto">
              เปิดแผนที่ในหน้านี้ไม่ได้{" "}
              <a href={fallbackHref} target="_blank" rel="noopener noreferrer" className="text-volt underline underline-offset-4">
                ดูบน Google Maps
              </a>
            </span>
          ) : (
            "กำลังโหลดแผนที่"
          )}
        </p>
      )}
    </div>
  );
}

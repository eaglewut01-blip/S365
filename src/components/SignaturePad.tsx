"use client";

import { useEffect, useImperativeHandle, useRef, type PointerEvent, type Ref } from "react";
import { SIGNATURE_HEIGHT, SIGNATURE_MAX_LENGTH, SIGNATURE_WIDTH } from "@/lib/signature";

export type SignaturePadHandle = { clear: () => void };
type Point = [number, number];

function toPath(strokes: Point[][]): string {
  return strokes
    .map((stroke) => {
      const [first, ...rest] = stroke;
      // A single tap still leaves a dot.
      const tail = rest.length ? rest : [first];
      return `M${first[0]} ${first[1]}` + tail.map(([x, y]) => `L${x} ${y}`).join("");
    })
    .join("");
}

// A sheet to sign with a finger. Reports the strokes each time the pen lifts;
// an empty string means nothing has been signed yet.
export function SignaturePad({ onChange, ref }: { onChange: (signature: string) => void; ref?: Ref<SignaturePadHandle> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const drawing = useRef(false);

  const redraw = () => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    ctx.setTransform(el.width / SIGNATURE_WIDTH, 0, 0, el.height / SIGNATURE_HEIGHT, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIGNATURE_WIDTH, SIGNATURE_HEIGHT);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes.current) {
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (const [x, y] of stroke.length > 1 ? stroke.slice(1) : stroke) ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const scale = Math.min(window.devicePixelRatio || 1, 3);
    el.width = SIGNATURE_WIDTH * scale;
    el.height = SIGNATURE_HEIGHT * scale;
    redraw();
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => {
      strokes.current = [];
      redraw();
      onChange("");
    },
  }));

  const pointOf = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - box.left) / box.width) * SIGNATURE_WIDTH);
    const y = Math.round(((event.clientY - box.top) / box.height) * SIGNATURE_HEIGHT);
    return [Math.max(0, Math.min(SIGNATURE_WIDTH, x)), Math.max(0, Math.min(SIGNATURE_HEIGHT, y))];
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    strokes.current.push([pointOf(event)]);
    redraw();
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const stroke = strokes.current[strokes.current.length - 1];
    const last = stroke[stroke.length - 1];
    const next = pointOf(event);
    if (Math.abs(next[0] - last[0]) + Math.abs(next[1] - last[1]) < 3) return;
    // Stop adding once the signature is as long as the database accepts.
    if (toPath(strokes.current).length > SIGNATURE_MAX_LENGTH - 200) return;
    stroke.push(next);
    redraw();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(toPath(strokes.current));
  };

  return (
    <canvas
      ref={canvas}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="ช่องเซ็นชื่อ"
      className="block w-full touch-none rounded-xl border-2 border-dashed border-border-strong bg-white select-none"
      style={{ aspectRatio: `${SIGNATURE_WIDTH} / ${SIGNATURE_HEIGHT}` }}
    />
  );
}

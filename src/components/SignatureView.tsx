import { SIGNATURE_HEIGHT, SIGNATURE_WIDTH, isSignature } from "@/lib/signature";

// Shows a stored signature in light strokes on the theme's dark panel. (It was
// dark ink on a white slip, which a browser's forced dark mode turned into a
// black box with nothing visible.)
export function SignatureView({ signature, className }: { signature: string | null | undefined; className?: string }) {
  if (!isSignature(signature)) return null;
  return (
    <svg viewBox={`0 0 ${SIGNATURE_WIDTH} ${SIGNATURE_HEIGHT}`} role="img" aria-label="ลายเซ็นลูกค้า" className={`border border-border-strong bg-panel-raised text-text-hi ${(className ?? "h-14 w-32 rounded-md").replace(/\bbg-white\b/g, "")}`}>
      <path d={signature} fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

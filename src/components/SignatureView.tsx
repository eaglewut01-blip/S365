import { SIGNATURE_HEIGHT, SIGNATURE_WIDTH, isSignature } from "@/lib/signature";

// Shows a stored signature on a white slip, the way it was signed.
export function SignatureView({ signature, className }: { signature: string | null | undefined; className?: string }) {
  if (!isSignature(signature)) return null;
  return (
    <svg viewBox={`0 0 ${SIGNATURE_WIDTH} ${SIGNATURE_HEIGHT}`} role="img" aria-label="ลายเซ็นลูกค้า" className={className ?? "h-14 w-32 rounded-md bg-white"}>
      <path d={signature} fill="none" stroke="#111111" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

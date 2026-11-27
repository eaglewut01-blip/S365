import { Paperclip } from "lucide-react";

// A link to the payment slip attached to a sale; opens in a new tab.
export function ProofLink({ purchaseId }: { purchaseId: string }) {
  return (
    <a
      href={`/owner/proof/${purchaseId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[12.5px] text-volt no-underline hover:underline"
    >
      <Paperclip size={12} /> ดูหลักฐาน
    </a>
  );
}

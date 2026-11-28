import { FileText, Paperclip } from "lucide-react";

const link = "inline-flex items-center gap-1 text-[12.5px] text-volt no-underline hover:underline";

// Links to the files attached to a sale: the payment slip, then each
// contract or document photo. Each opens in a new tab.
export function SaleFiles({ purchase }: { purchase: { id: string; proof_path?: string | null; document_paths?: string[] | null } }) {
  const documents = purchase.document_paths ?? [];
  if (!purchase.proof_path && documents.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      {purchase.proof_path && (
        <a href={`/owner/proof/${purchase.id}`} target="_blank" rel="noopener noreferrer" className={link}>
          <Paperclip size={12} /> ดูหลักฐานชำระเงิน
        </a>
      )}
      {documents.map((_, i) => (
        <a key={i} href={`/owner/proof/${purchase.id}?f=${i}`} target="_blank" rel="noopener noreferrer" className={link}>
          <FileText size={12} /> สัญญา/เอกสาร {documents.length > 1 ? i + 1 : ""}
        </a>
      ))}
    </span>
  );
}

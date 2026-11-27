// Browser side: shrink a photo of a payment slip and put it in the private
// payment-proofs bucket, under the branch's folder.
import { shrinkImage } from "@/app/owner/website/media";
import { createClient } from "@/lib/supabase/client";

export const PAYMENT_PROOF_BUCKET = "payment-proofs";

export async function uploadPaymentProof(branchId: string, file: File): Promise<string> {
  const { blob } = await shrinkImage(file, 1600);
  const path = `${branchId}/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient().storage.from(PAYMENT_PROOF_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw new Error(error.message);
  return path;
}

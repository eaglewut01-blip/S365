import { NextResponse } from "next/server";
import { getCurrentProfile, isStaffRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// Opens the payment slip attached to a sale: checks the signed-in person is
// staff, then sends them to a link that works for five minutes. Both the
// sale and the file are also behind row level security.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !isStaffRole(profile.role)) return new NextResponse("ไม่มีสิทธิ์ดูไฟล์นี้", { status: 403 });

  const supabase = await createClient();
  const { data: purchase } = await supabase.from("member_purchases").select("proof_path").eq("id", id).maybeSingle();
  if (!purchase?.proof_path) return new NextResponse("รายการนี้ไม่มีหลักฐานแนบไว้", { status: 404 });

  const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(purchase.proof_path, 300);
  if (error || !data) return new NextResponse("เปิดไฟล์ไม่ได้", { status: 502 });
  return NextResponse.redirect(data.signedUrl);
}

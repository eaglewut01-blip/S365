import { NextResponse } from "next/server";
import { getCurrentProfile, isStaffRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// Opens a file attached to a sale (payment slip, contract, other papers): checks the signed-in person is
// staff, then sends them to a link that works for five minutes. Both the
// sale and the file are also behind row level security.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Without ?f the payment slip; with ?f=0,1,2... that contract or document photo.
  const fileIndex = new URL(request.url).searchParams.get("f");
  const profile = await getCurrentProfile();
  if (!profile || !isStaffRole(profile.role)) return new NextResponse("ไม่มีสิทธิ์ดูไฟล์นี้", { status: 403 });

  const supabase = await createClient();
  const { data: purchase } = await supabase.from("member_purchases").select("*").eq("id", id).maybeSingle();
  const documents = (purchase?.document_paths ?? []) as string[];
  const path: string | undefined = fileIndex === null ? purchase?.proof_path : /^\d{1,2}$/.test(fileIndex) ? documents[Number(fileIndex)] : undefined;
  if (!path) return new NextResponse("ไม่พบไฟล์ที่แนบไว้", { status: 404 });

  const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
  if (error || !data) return new NextResponse("เปิดไฟล์ไม่ได้", { status: 502 });
  return NextResponse.redirect(data.signedUrl);
}

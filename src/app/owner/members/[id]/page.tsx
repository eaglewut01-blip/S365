import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Member, MemberPurchase, Package, Profile } from "@/types/database";
import { MemberDetailClient, type PtVisit } from "./MemberDetailClient";

export const metadata = { title: "ข้อมูลสมาชิก | S365 Fitness" };

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const { data: member } = await supabase.from("members").select("*").eq("id", id).maybeSingle<Member>();
  if (!member) notFound();

  const [purchases, packages, team, sessions] = await Promise.all([
    supabase.from("member_purchases").select("*").eq("member_id", id).order("purchased_on", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("packages").select("*").eq("branch_id", branchId).eq("active", true).order("kind").order("price"),
    supabase.from("profiles").select("*").eq("branch_id", branchId).in("role", ["owner", "staff", "trainer", "left"]).order("full_name"),
    supabase.from("pt_sessions").select("id, session_date, session_time, status, signature, trainer_id").eq("member_id", id).order("logged_at", { ascending: false }).limit(200),
  ]);

  return (
    <MemberDetailClient
      member={member}
      purchases={(purchases.data ?? []) as MemberPurchase[]}
      packages={(packages.data ?? []) as Package[]}
      team={((team.data ?? []) as Profile[]).filter((t) => !t.counter_only)}
      currentUserId={profile.counter_only ? "" : profile.id}
      sessions={((sessions.data ?? []) as PtVisit[]).filter((s) => s.status === "approved")}
      isOwner={profile.role === "owner"}
      missingTables={Boolean(purchases.error)}
    />
  );
}

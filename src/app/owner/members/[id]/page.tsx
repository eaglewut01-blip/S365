import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Member, MemberPurchase, Package, Profile } from "@/types/database";
import { MemberDetailClient } from "./MemberDetailClient";

export const metadata = { title: "ข้อมูลสมาชิก | S365 Fitness" };

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const { data: member } = await supabase.from("members").select("*").eq("id", id).maybeSingle<Member>();
  if (!member) notFound();

  const [purchases, packages, team] = await Promise.all([
    supabase.from("member_purchases").select("*").eq("member_id", id).order("purchased_on", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("packages").select("*").eq("branch_id", branchId).eq("active", true).order("kind").order("price"),
    supabase.from("profiles").select("id, full_name, role").eq("branch_id", branchId).in("role", ["owner", "staff", "trainer"]).order("full_name"),
  ]);

  return (
    <MemberDetailClient
      member={member}
      purchases={(purchases.data ?? []) as MemberPurchase[]}
      packages={(packages.data ?? []) as Package[]}
      team={(team.data ?? []) as Pick<Profile, "id" | "full_name" | "role">[]}
      currentUserId={profile.id}
      isOwner={profile.role === "owner"}
      missingTables={Boolean(purchases.error)}
    />
  );
}

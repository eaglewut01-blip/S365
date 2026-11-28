import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PenLine, Phone, ShoppingCart } from "lucide-react";
import { SignatureView } from "@/components/SignatureView";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { expiryLabel, expiryState, formatDateTh } from "@/lib/dates";
import { PT_LOW_HOURS } from "@/lib/labels";
import type { Member, MemberPurchase } from "@/types/database";

export const metadata = { title: "ลูกค้าของฉัน | S365 Fitness" };

// One of the trainer's own clients: hours left, membership, the sessions they
// have signed for, and what they bought. Another trainer's client is not found.
export default async function TrainerClientPage({ params }: { params: Promise<{ id: string }> }) {
  const trainer = await requireRole("trainer");
  const { id } = await params;
  const supabase = await createClient();

  const { data: member } = await supabase.from("members").select("*").eq("id", id).eq("pt_trainer_id", trainer.id).maybeSingle<Member>();
  if (!member || member.pt_trainer_id !== trainer.id) notFound();

  const [sessionsResult, purchasesResult] = await Promise.all([
    supabase.from("pt_sessions").select("id, session_date, session_time, status, signature").eq("member_id", id).eq("trainer_id", trainer.id).order("logged_at", { ascending: false }).limit(200),
    // Row level security returns only the sales this trainer made or trains for.
    supabase.from("member_purchases").select("*").eq("member_id", id).order("purchased_on", { ascending: false }).limit(100),
  ]);
  const sessions = ((sessionsResult.data ?? []) as { id: string; session_date: string; session_time: string; status: string; signature: string | null }[]).filter((s) => s.status === "approved");
  const purchases = (purchasesResult.data ?? []) as MemberPurchase[];

  const membership = expiryState(member.membership_expires_on);
  const used = member.pt_total - member.pt_remaining;
  const box = "rounded-xl border border-border bg-panel p-4";
  const action = "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-3 font-body text-[14px] font-semibold no-underline";

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-7">
      <Link href="/trainer/clients" className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-text-lo no-underline hover:text-text-hi">
        <ArrowLeft size={14} /> ลูกค้าของฉัน
      </Link>
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">{member.name}</h1>
      {member.phone && (
        <a href={`tel:${member.phone.replace(/[^\d+]/g, "")}`} className="mt-1 inline-flex items-center gap-1.5 text-[14.5px] text-volt no-underline">
          <Phone size={14} /> {member.phone}
        </a>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className={box}>
          <div className="text-[12.5px] text-text-lo">ชั่วโมง PT ที่เหลือ</div>
          <div className={`mt-1 font-heading text-[30px] leading-none ${member.pt_remaining <= 0 ? "text-coral" : member.pt_remaining <= PT_LOW_HOURS ? "text-amber" : "text-text-hi"}`}>{member.pt_remaining}</div>
          <div className="mt-1 text-[12.5px] text-text-faint">
            จาก {member.pt_total} ชั่วโมง ใช้ไป {used}
          </div>
        </div>
        <div className={box}>
          <div className="text-[12.5px] text-text-lo">สมาชิกรายเดือน</div>
          <div className={`mt-1 text-[16px] font-semibold ${membership.state === "expired" || membership.state === "none" ? "text-coral" : membership.state === "soon" ? "text-amber" : "text-text-hi"}`}>{expiryLabel(member.membership_expires_on)}</div>
          <div className="mt-1 text-[12.5px] text-text-faint">{member.membership_expires_on ? `ถึง ${formatDateTh(member.membership_expires_on)}` : "ไม่มีรายเดือน เข้ายิมไม่ได้"}</div>
        </div>
      </div>
      <div className="mt-2 text-[12.5px] text-text-faint">
        มายิมล่าสุด {member.last_visit ? formatDateTh(member.last_visit) : "ยังไม่มีข้อมูล"} · มาแล้ว {member.visit_count} ครั้ง
      </div>

      <div className="mt-4 flex gap-2.5">
        {member.pt_remaining > 0 && (
          <Link href={`/trainer/pt-sessions?m=${member.id}`} className={`${action} border border-mint bg-mint text-[#0A2A1F]`}>
            <PenLine size={15} /> ให้ลูกค้าเซ็น
          </Link>
        )}
        <Link href="/trainer/sell" className={`${action} border border-border-strong text-text-hi`}>
          <ShoppingCart size={15} /> ขายเพิ่ม
        </Link>
      </div>

      <h2 className="mt-7 mb-2 font-heading text-[15px] text-text-hi">เทรนกับฉันแล้ว {sessions.length} ครั้ง</h2>
      <div className="flex flex-col gap-2">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel px-4 py-2.5">
            <div className="text-[14px] text-text-hi">
              {formatDateTh(s.session_date)} <span className="text-text-faint">เวลา {s.session_time.slice(0, 5)} น.</span>
            </div>
            <SignatureView signature={s.signature} className="h-11 w-24 flex-shrink-0 rounded-md bg-white" />
          </div>
        ))}
        {sessions.length === 0 && <div className="text-[13px] text-text-faint">ยังไม่มีการเซ็นรับการเทรนในระบบนี้</div>}
      </div>

      <h2 className="mt-7 mb-2 font-heading text-[15px] text-text-hi">รายการซื้อที่เกี่ยวกับฉัน</h2>
      <div className="flex flex-col gap-2">
        {purchases.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-panel px-4 py-2.5">
            <div className="text-[14px] text-text-hi">{p.package_name}</div>
            <div className="text-[12.5px] text-text-faint">
              {formatDateTh(p.purchased_on)}
              {p.kind === "pt" ? ` · ${p.pt_sessions} ชั่วโมง` : p.ends_on ? ` · ถึง ${formatDateTh(p.ends_on)}` : ""}
              {p.sold_by === trainer.id ? ` · ฉันขาย ฿${Number(p.amount).toLocaleString("th-TH")}` : ""}
            </div>
          </div>
        ))}
        {purchases.length === 0 && <div className="text-[13px] text-text-faint">ยังไม่มีรายการที่คุณขายหรือเป็นเทรนเนอร์</div>}
      </div>
    </div>
  );
}

import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { requireRole } from "@/lib/session";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../website/qr/PrintButton";
import { ResetStaffTokenButton } from "./ResetStaffTokenButton";

export const metadata = { title: "ป้าย QR เข้างาน | S365 Fitness" };

async function baseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL) return siteUrl;
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  return host ? `${list.get("x-forwarded-proto") ?? "https"}://${host}` : siteUrl;
}

// The poster the team scans when they arrive. Only the owner can open this
// page, so the code cannot be copied from the back office by someone at home.
export default async function StaffQrPage() {
  const owner = await requireRole("owner");
  const supabase = await createClient();
  const { data: secret, error } = await supabase.from("branch_secrets").select("staff_token").eq("branch_id", owner.branch_id ?? "").maybeSingle();

  const token = secret?.staff_token as string | null | undefined;
  const url = token ? `${await baseUrl()}/work?t=${encodeURIComponent(token)}` : "";
  const svg = url ? await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "Q", margin: 2, color: { dark: "#000000", light: "#ffffff" } }) : "";

  return (
    <div className="min-h-screen bg-white p-6 text-black print:p-0">
      <div className="mb-6 max-w-2xl print:hidden">
        <Link href="/owner/attendance" className="font-body text-sm text-neutral-600 underline">
          กลับหน้าเข้างานพนักงาน
        </Link>
        <h1 className="mt-2 font-body text-xl font-bold">ป้าย QR เข้างานของทีมงาน</h1>
        <p className="mt-1 font-body text-sm leading-relaxed text-neutral-600">
          พิมพ์ป้ายนี้ติดไว้หลังเคาน์เตอร์หรือห้องพนักงาน ทีมงานมาถึงแล้วเปิดกล้องมือถือตัวเองสแกน ระบบขึ้นชื่อและบันทึกเวลาเข้างานให้ทันที
          ครั้งแรกต้องเข้าสู่ระบบด้วยไอดีของตัวเองหนึ่งครั้ง หลังจากนั้นมือถือจะจำไว้ สแกนซ้ำในวันเดียวกันไม่เปลี่ยนเวลา
        </p>
        <p className="mt-1 font-body text-sm leading-relaxed text-neutral-600">ถ้าสงสัยว่ามีคนถ่ายรูปป้ายไปสแกนจากที่อื่น กดสร้างรหัสใหม่แล้วพิมพ์ป้ายใหม่ ป้ายเดิมจะใช้ไม่ได้ทันที</p>
        {error && <p className="mt-2 font-body text-sm font-semibold text-red-700">ยังใช้ไม่ได้ ต้องรันคำสั่งฐานข้อมูลรอบล่าสุด (supabase/memberships.sql) หนึ่งครั้งก่อน</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {token && <PrintButton />}
          {!error && <ResetStaffTokenButton hasToken={Boolean(token)} />}
        </div>
      </div>

      {token && (
        <div className="mx-auto flex max-w-[520px] flex-col items-center border border-dashed border-neutral-400 px-8 py-10 text-center print:mt-10 print:border-none">
          <p className="font-heading text-5xl leading-none tracking-wide">S365 FITNESS</p>
          <p className="mt-4 font-body text-3xl font-bold">ทีมงานสแกนเข้างาน</p>
          <p className="font-body text-lg text-neutral-600">สำหรับพนักงานและเทรนเนอร์เท่านั้น</p>
          <div className="my-5 w-full max-w-[340px]" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="font-body text-base leading-relaxed">
            1. เปิดกล้องมือถือของตัวเองสแกน QR
            <br />
            2. ระบบขึ้นชื่อและเวลาเข้างาน
          </p>
        </div>
      )}
    </div>
  );
}

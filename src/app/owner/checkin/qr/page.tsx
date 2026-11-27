import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { requireRole } from "@/lib/session";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../website/qr/PrintButton";
import { ResetTokenButton } from "./ResetTokenButton";

export const metadata = { title: "ป้าย QR เช็กอิน | S365 Fitness" };

// The address printed into the QR code. A configured site address wins;
// otherwise use the address the owner is browsing on right now.
async function baseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL) return siteUrl;
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  return host ? `${list.get("x-forwarded-proto") ?? "https"}://${host}` : siteUrl;
}

export default async function CheckinQrPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const { data: branch, error } = await supabase.from("branches").select("name, checkin_token").eq("id", profile.branch_id ?? "").maybeSingle();

  const base = await baseUrl();
  const token = branch?.checkin_token as string | null | undefined;
  const url = token ? `${base}/checkin?k=${encodeURIComponent(token)}` : "";
  const svg = url ? await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "Q", margin: 2, color: { dark: "#000000", light: "#ffffff" } }) : "";
  const isOwner = profile.role === "owner";

  return (
    <div className="min-h-screen bg-white p-6 text-black print:p-0">
      <div className="mb-6 max-w-2xl print:hidden">
        <Link href="/owner/checkin" className="font-body text-sm text-neutral-600 underline">
          กลับหน้าเช็กอิน
        </Link>
        <h1 className="mt-2 font-body text-xl font-bold">ป้าย QR เช็กอินหน้ายิม</h1>
        <p className="mt-1 font-body text-sm leading-relaxed text-neutral-600">
          พิมพ์ป้ายนี้ตั้งไว้ที่เคาน์เตอร์ ลูกค้าเปิดกล้องมือถือสแกน กรอกเบอร์โทรที่ลงทะเบียนไว้ แล้วกดเช็กอิน
          สแกนซ้ำภายใน 3 ชั่วโมงจะไม่นับเพิ่ม
        </p>
        {error && (
          <p className="mt-2 font-body text-sm font-semibold text-red-700">
            ยังใช้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ supabase/memberships.sql หนึ่งครั้งก่อน
          </p>
        )}
        {!error && !token && (
          <p className="mt-2 font-body text-sm font-semibold text-red-700">
            ยังไม่ได้สร้างรหัสของป้าย {isOwner ? "กดปุ่มด้านล่างเพื่อสร้าง" : "ให้เจ้าของเข้ามาสร้างที่หน้านี้"}
          </p>
        )}
        {/\/\/(localhost|127\.|0\.0\.0\.0)/.test(base) && (
          <p className="mt-2 font-body text-sm font-semibold text-red-700">ตอนนี้เปิดจากเครื่องทดสอบ ({base}) ป้ายที่พิมพ์จากหน้านี้จะใช้กับมือถือลูกค้าไม่ได้</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {token && <PrintButton />}
          {isOwner && !error && <ResetTokenButton hasToken={Boolean(token)} />}
        </div>
      </div>

      {token && (
        <div className="mx-auto flex max-w-[520px] flex-col items-center border border-dashed border-neutral-400 px-8 py-10 text-center print:mt-10 print:border-none">
          <p className="font-heading text-5xl leading-none tracking-wide">S365 FITNESS</p>
          <p className="mt-4 font-body text-3xl font-bold">สแกนเพื่อเช็กอิน</p>
          <p className="font-body text-lg text-neutral-600">Scan to check in</p>
          <div className="my-5 w-full max-w-[340px]" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="font-body text-base leading-relaxed">
            1. เปิดกล้องมือถือสแกน QR
            <br />
            2. กรอกเบอร์โทรที่ลงทะเบียนไว้
            <br />
            3. กดเช็กอิน
          </p>
          {branch?.name && <p className="mt-4 font-body text-sm text-neutral-500">{branch.name}</p>}
        </div>
      )}
    </div>
  );
}

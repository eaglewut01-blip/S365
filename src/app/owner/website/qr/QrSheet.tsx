import QRCode from "qrcode";
import { PrintButton } from "./PrintButton";

export interface QrMachine {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  hidden: boolean;
}

// A printable sheet of labels, one per machine. Each QR code opens that
// machine's public how-to page; the address never changes once the machine exists.
export async function QrSheet({ base, machines }: { base: string; machines: QrMachine[] }) {
  const local = /\/\/(localhost|127\.|0\.0\.0\.0)/.test(base);
  const labels = await Promise.all(
    machines.map(async (machine) => ({
      ...machine,
      svg: await QRCode.toString(`${base}/machines/${encodeURIComponent(machine.slug)}`, {
        type: "svg",
        errorCorrectionLevel: "Q",
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }),
    }))
  );

  return (
    <div className="min-h-screen bg-white p-6 text-black print:p-0">
      <div className="mb-6 max-w-2xl print:hidden">
        <h1 className="font-body text-xl font-bold">ป้าย QR วิธีเล่นเครื่อง</h1>
        <p className="mt-1 font-body text-sm leading-relaxed text-neutral-600">
          พิมพ์หน้านี้ลงกระดาษ A4 หรือกระดาษสติกเกอร์ แล้วตัดไปติดที่เครื่อง สมาชิกสแกนแล้วจะเปิดหน้าวิธีเล่นของเครื่องนั้น ป้ายใช้ได้ตลอด
          แม้จะแก้ชื่อหรือเปลี่ยนคลิปภายหลัง
        </p>
        {local && (
          <p className="mt-2 font-body text-sm font-semibold text-red-700">
            ตอนนี้เปิดจากเครื่องทดสอบ ({base}) QR ที่พิมพ์จากหน้านี้จะสแกนจากมือถือไม่ได้ ให้เปิดหน้านี้จากเว็บจริงก่อนพิมพ์
          </p>
        )}
        {labels.length > 0 && <PrintButton />}
      </div>

      {labels.length === 0 ? (
        <p className="font-body text-sm text-neutral-600">ยังไม่มีเครื่องในระบบ เพิ่มเครื่องที่แท็บ วิธีเล่นเครื่อง ก่อน</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-0">
          {labels.map((label) => (
            <li
              key={label.id}
              className="flex break-inside-avoid flex-col items-center border border-dashed border-neutral-400 px-3 py-4 text-center"
            >
              <p className="font-heading text-2xl leading-none tracking-wide">S365 FITNESS</p>
              <div className="my-2 w-full max-w-[190px]" dangerouslySetInnerHTML={{ __html: label.svg }} />
              <p className="font-body text-[15px] font-bold leading-tight">{label.name}</p>
              {label.nameEn && <p className="font-body text-xs text-neutral-600">{label.nameEn}</p>}
              <p className="mt-1 font-body text-xs font-semibold">สแกนดูวิธีเล่น / Scan for how-to</p>
              {label.hidden && <p className="mt-1 font-body text-[11px] text-red-700 print:hidden">เครื่องนี้ซ่อนอยู่ สแกนแล้วจะยังไม่เจอหน้า</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

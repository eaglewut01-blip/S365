"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Eraser, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";
import { SignatureView } from "@/components/SignatureView";
import { signPtSession } from "@/lib/actions/pt-sessions";
import { formatDateTh } from "@/lib/dates";

export type SignClient = { id: string; name: string; total: number; left: number; mine: boolean };
export type SignedSession = { id: string; date: string; time: string; name: string; signature: string | null };

function ClientButton({ client, onPick }: { client: SignClient; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-panel px-4 py-3 text-left hover:border-volt"
    >
      <span className="min-w-0">
        <span className="block truncate text-[15.5px] font-semibold text-text-hi">{client.name}</span>
        <span className={`mt-0.5 block text-[12.5px] ${client.left <= 2 ? "text-amber" : "text-text-lo"}`}>
          เหลือ {client.left} จาก {client.total} ชั่วโมง
        </span>
      </span>
      <ChevronRight size={18} className="flex-shrink-0 text-text-faint" />
    </button>
  );
}

export function SignOffClient({ clients, signed, today, trainerName }: { clients: SignClient[]; signed: SignedSession[]; today: string; trainerName: string }) {
  const router = useRouter();
  const pad = useRef<SignaturePadHandle>(null);
  const [picked, setPicked] = useState<SignClient | null>(null);
  const [signature, setSignature] = useState("");
  const [done, setDone] = useState<{ name: string; remaining: number } | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const mine = useMemo(() => clients.filter((c) => c.mine), [clients]);
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return clients.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 20);
  }, [clients, query]);
  const signedToday = signed.filter((s) => s.date === today);

  const back = () => {
    setPicked(null);
    setSignature("");
    setError("");
  };

  const confirm = () => {
    if (!picked) return;
    setError("");
    startTransition(async () => {
      const res = await signPtSession(picked.id, signature);
      if (res.error) return setError(res.error);
      setDone({ name: picked.name, remaining: res.remaining ?? picked.left - 1 });
      setPicked(null);
      setSignature("");
      router.refresh();
    });
  };

  // Step 3: done
  if (done) {
    return (
      <div className="mx-auto max-w-md p-4 pt-10 text-center sm:p-7">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint">
          <Check size={34} color="#0A2A1F" strokeWidth={3} />
        </div>
        <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">บันทึกแล้ว</h1>
        <p className="mt-2 mb-1 text-[15px] text-text-hi">{done.name}</p>
        <p className="mt-0 mb-6 text-[14px] text-text-lo">
          ตัดไป 1 ชั่วโมง เหลือ <span className="font-semibold text-text-hi">{done.remaining}</span> ชั่วโมง
        </p>
        <Button variant="primary" onClick={() => setDone(null)} className="w-full py-3.5 text-[15px]">
          เสร็จ
        </Button>
      </div>
    );
  }

  // Step 2: the client signs
  if (picked) {
    return (
      <div className="mx-auto max-w-md p-4 sm:p-7">
        <button type="button" onClick={back} className="mb-3 inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-text-lo">
          <ArrowLeft size={14} /> เลือกลูกค้าใหม่
        </button>
        <div className="rounded-xl border border-border bg-panel p-4">
          <div className="text-[12.5px] text-text-lo">ลูกค้า</div>
          <div className="text-[19px] font-semibold text-text-hi">{picked.name}</div>
          <div className="mt-1 text-[13.5px] text-text-lo">
            เทรนเนอร์ {trainerName} · {formatDateTh(today)}
          </div>
          <div className="mt-3 rounded-lg bg-panel-raised px-3 py-2.5 text-[14px] text-text-hi">
            ชั่วโมง PT เหลือ {picked.left} ชั่วโมง เซ็นแล้วจะเหลือ <span className="font-semibold text-volt">{picked.left - 1}</span> ชั่วโมง
          </div>
        </div>

        <p className="mt-4 mb-2 text-[14px] text-text-hi">ลูกค้าเซ็นชื่อในช่องสีขาว เพื่อยืนยันว่าเทรนครบ 1 ชั่วโมงแล้ว</p>
        <SignaturePad ref={pad} onChange={setSignature} />
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={() => pad.current?.clear()} className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-1 text-[13px] text-text-lo">
            <Eraser size={14} /> ล้างแล้วเซ็นใหม่
          </button>
        </div>

        {error && <div className="mt-2 rounded-lg border border-coral bg-coral-bg px-3 py-2.5 text-[13.5px] text-text-hi">{error}</div>}
        <Button variant="confirm" onClick={confirm} disabled={pending || !signature} className="mt-3 w-full py-4 text-[16px]">
          {pending ? "กำลังบันทึก..." : "ยืนยัน ตัด 1 ชั่วโมง"}
        </Button>
      </div>
    );
  }

  // Step 1: pick the client
  return (
    <div className="mx-auto max-w-md p-4 sm:p-7">
      <h1 className="m-0 mb-1 font-heading text-2xl font-bold text-text-hi">ให้ลูกค้าเซ็นรับการเทรน</h1>
      <p className="mt-0 mb-4 text-[13.5px] text-text-lo">เทรนเสร็จแล้วแตะชื่อลูกค้า ให้ลูกค้าเซ็นบนจอ กดยืนยัน ระบบตัดชั่วโมงให้ทันที</p>

      <label className="relative mb-4 block">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อลูกค้า" aria-label="ค้นหาชื่อลูกค้า" className="!py-3 !pl-9 !text-[15px]" />
      </label>

      {query.trim() ? (
        <div className="flex flex-col gap-2">
          {found.map((c) => (
            <ClientButton key={c.id} client={c} onPick={() => setPicked(c)} />
          ))}
          {found.length === 0 && <div className="rounded-xl border border-border bg-panel p-5 text-center text-[13.5px] text-text-faint">ไม่พบลูกค้าชื่อนี้ที่ยังมีชั่วโมง PT เหลือ</div>}
        </div>
      ) : (
        <>
          <h2 className="m-0 mb-2 font-heading text-[15px] text-text-hi">ลูกค้าของฉัน {mine.length} คน</h2>
          <div className="flex flex-col gap-2">
            {mine.map((c) => (
              <ClientButton key={c.id} client={c} onPick={() => setPicked(c)} />
            ))}
            {mine.length === 0 && (
              <div className="rounded-xl border border-border bg-panel p-5 text-center text-[13.5px] leading-relaxed text-text-faint">
                ยังไม่มีลูกค้าที่ผูกกับชื่อคุณ พิมพ์ชื่อลูกค้าในช่องค้นหาด้านบนได้เลย เซ็นครั้งแรกแล้วลูกค้าจะมาอยู่ในรายการนี้
              </div>
            )}
          </div>
        </>
      )}

      <h2 className="mt-7 mb-2 font-heading text-[15px] text-text-hi">วันนี้เซ็นแล้ว {signedToday.length} ชั่วโมง</h2>
      <div className="flex flex-col gap-2">
        {signedToday.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel px-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-text-hi">{s.name}</div>
              <div className="text-[12.5px] text-text-faint">{s.time} น.</div>
            </div>
            <SignatureView signature={s.signature} className="h-11 w-24 flex-shrink-0 rounded-md bg-white" />
          </div>
        ))}
        {signedToday.length === 0 && <div className="text-[13px] text-text-faint">ยังไม่มี</div>}
      </div>
      <div className="mt-4 text-[13px] text-text-lo">30 วันล่าสุดเทรนไปแล้ว {signed.length} ชั่วโมง</div>
    </div>
  );
}

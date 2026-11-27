import type { Metadata } from "next";
import { CheckinForm } from "./CheckinForm";

export const metadata: Metadata = {
  title: "เช็กอิน | S365 Fitness",
  robots: { index: false, follow: false },
};

// Opened by scanning the QR code at the front desk; `k` is that code's secret.
export default async function SelfCheckinPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;
  return (
    <div className="flex min-h-screen items-start justify-center bg-base px-4 py-10 sm:items-center">
      <CheckinForm token={k ?? ""} />
    </div>
  );
}

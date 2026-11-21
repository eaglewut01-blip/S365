"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-4 cursor-pointer rounded-lg bg-black px-4 py-2 font-body text-sm font-semibold text-white hover:bg-neutral-800"
    >
      พิมพ์ป้าย
    </button>
  );
}

import clsx from "clsx";

type Tone = "coral" | "mint" | "amber" | "default";

const toneClasses: Record<Tone, string> = {
  coral: "text-coral",
  mint: "text-mint",
  amber: "text-amber",
  default: "text-text-hi",
};

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="min-w-[160px] flex-1 rounded-xl border border-border bg-panel px-[18px] py-4">
      <div className="mb-2 font-body text-[12.5px] text-text-lo">{label}</div>
      <div className={clsx("font-heading text-[28px] leading-none font-bold", toneClasses[tone])}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-text-faint">{sub}</div>}
    </div>
  );
}

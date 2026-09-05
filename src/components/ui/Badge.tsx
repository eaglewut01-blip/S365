import clsx from "clsx";

type Tone = "neutral" | "active" | "frozen" | "cancelled" | "paid" | "due" | "overdue";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-white/[0.06] text-text-lo",
  active: "bg-mint-bg text-mint",
  frozen: "bg-amber-bg text-amber",
  cancelled: "bg-coral-bg text-coral",
  paid: "bg-mint-bg text-mint",
  due: "bg-amber-bg text-amber",
  overdue: "bg-coral-bg text-coral",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={clsx(
        "whitespace-nowrap rounded-full px-2.5 py-1 font-body text-xs font-semibold",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

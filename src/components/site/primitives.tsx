import clsx from "clsx";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("mx-auto w-full max-w-[1240px] px-5 md:px-8", className)}>{children}</div>;
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex flex-col leading-none", className)}>
      <span className="font-heading text-[1.75em] tracking-wide text-volt">S365</span>
      <span className="font-body text-[0.56em] font-semibold tracking-[0.34em] text-text-hi">FITNESS</span>
    </span>
  );
}

const DIGITS = "0123465789".split("");
const HIGHLIGHTED = new Set(["3", "6", "5"]);

// The digit wall inside the gym: 0–9 with 5 and 6 swapped so the yellow digits read 3·6·5.
export function DigitWall({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx("flex select-none justify-between font-heading leading-[0.8]", className)}>
      {DIGITS.map((d) => (
        <span key={d} className={HIGHLIGHTED.has(d) ? "text-volt" : "text-text-hi/15"}>
          {d}
        </span>
      ))}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-heading text-[15px] tracking-[0.3em] text-volt">{eyebrow}</p>
      <h2 className="mt-3 text-[clamp(1.85rem,4.2vw,2.75rem)] font-semibold leading-[1.2] text-balance text-text-hi">{title}</h2>
      {children && <p className="mt-4 font-light leading-relaxed text-pretty text-text-lo">{children}</p>}
    </div>
  );
}

type CtaVariant = "primary" | "secondary";

const ctaVariants: Record<CtaVariant, string> = {
  primary: "bg-volt text-volt-ink hover:brightness-110",
  secondary: "border border-border-strong text-text-hi hover:bg-white/5",
};

export function CtaLink({
  href,
  variant = "primary",
  external,
  className,
  children,
}: {
  href: string;
  variant?: CtaVariant;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[15px] font-medium transition",
        ctaVariants[variant],
        className
      )}
    >
      {children}
    </a>
  );
}

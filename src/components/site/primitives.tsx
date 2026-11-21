import clsx from "clsx";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("mx-auto w-full max-w-[1240px] px-5 md:px-8", className)}>{children}</div>;
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex flex-col leading-none", className)}>
      <span className="font-heading text-[2.25em] leading-[0.85] text-volt">S365</span>
      <span className="mt-[0.5em] text-[0.62em] font-medium tracking-[0.44em] text-white">FITNESS</span>
    </span>
  );
}

// Section heading: eyebrow and title on the left, a short supporting line on the right (stacked on phones).
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
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
      <div>
        <p className="font-heading text-[17px] tracking-[0.3em] text-volt">{eyebrow}</p>
        <h2 className="mt-1 text-[clamp(1.75rem,6.4vw,3.25rem)] font-bold leading-[1.25] text-balance text-text-hi">
          {title}
        </h2>
      </div>
      {children && (
        <p className="max-w-[440px] font-light leading-relaxed text-pretty text-text-lo md:text-right">{children}</p>
      )}
    </div>
  );
}

type CtaVariant = "primary" | "secondary";

const ctaVariants: Record<CtaVariant, string> = {
  primary: "bg-volt text-volt-ink hover:brightness-110",
  secondary: "border border-white/45 bg-black/35 text-white hover:bg-black/55",
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
        "inline-flex items-center justify-center gap-2 rounded-[3px] px-6 py-3.5 text-base font-semibold transition md:px-7 md:py-[15px] md:text-[17px]",
        ctaVariants[variant],
        className
      )}
    >
      {children}
    </a>
  );
}

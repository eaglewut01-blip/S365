import clsx from "clsx";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-xl border border-border bg-panel p-[18px]", className)}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-[18px] flex items-end justify-between gap-4">
      <div>
        <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">{title}</h1>
        {subtitle && <p className="mt-1.5 font-body text-[13.5px] text-text-lo">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

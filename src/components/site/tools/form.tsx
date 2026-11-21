import clsx from "clsx";

// Shared form pieces for the visitor tools (dark panels, large touch targets).
export const inputClass =
  "h-12 w-full rounded-[3px] border border-white/20 bg-black/40 px-3.5 text-lg text-text-hi outline-none placeholder:text-text-faint focus:border-volt";

export function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-text-lo">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-text-lo">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={clsx(
              "min-h-11 cursor-pointer rounded-[3px] border px-4 py-2 text-[15px] font-medium transition",
              option.value === value
                ? "border-volt bg-volt text-volt-ink"
                : "border-white/20 text-text-hi hover:border-white/50"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("rounded-[3px] bg-[#111112] p-5 md:p-7", className)}>{children}</div>;
}

export function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-[3px] border border-white/10 p-4">
      <p className="text-[13px] text-text-lo">{label}</p>
      <p className="mt-1 font-heading text-4xl leading-none tracking-wide text-volt">
        {value}
        {unit && <span className="ml-1.5 font-thai text-sm font-normal tracking-normal text-text-lo">{unit}</span>}
      </p>
    </div>
  );
}

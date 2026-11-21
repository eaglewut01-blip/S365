// Decorative yellow band under the hero. Two identical halves so the loop is seamless.
export function Ticker({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  // Repeat short lists so one half is always wider than the screen.
  const repeated = Array.from({ length: Math.max(2, Math.ceil(15 / items.length)) }, () => items).flat();

  return (
    <div aria-hidden className="overflow-hidden bg-volt py-3 text-[#141414]">
      <div className="ticker-track flex w-max">
        {[0, 1].map((half) => (
          <ul key={half} className="flex shrink-0 font-heading text-[22px] tracking-[0.16em] md:text-[27px]">
            {repeated.map((item, i) => (
              <li key={i} className="flex items-center whitespace-nowrap">
                <span className="mx-[22px]">{item}</span>
                <span className="opacity-45">/</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

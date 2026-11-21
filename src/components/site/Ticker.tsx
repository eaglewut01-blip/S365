const items = ["PERSONAL TRAINING", "FUNCTIONAL TRAINING", "GROUP SESSION", "HYROX BANGKOK", "DEKA FIT"];

// Decorative yellow band under the hero. Two identical halves so the loop is seamless.
export function Ticker() {
  return (
    <div aria-hidden className="overflow-hidden bg-volt py-3 text-[#141414]">
      <div className="ticker-track flex w-max">
        {[0, 1].map((half) => (
          <ul key={half} className="flex shrink-0 font-heading text-[22px] tracking-[0.16em] md:text-[27px]">
            {[...items, ...items, ...items].map((item, i) => (
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

import type { SiteContent } from "@/lib/site-content";
import { CtaLink } from "./primitives";

// The group classes the gym runs, as a list of names. Hidden when the owner clears the list.
export function Classes({ content }: { content: SiteContent }) {
  const { classes, contact } = content;
  if (classes.items.length === 0) return null;
  return (
    <div className="mt-12 md:mt-16">
      <h3 className="text-2xl font-semibold text-text-hi md:text-3xl">{classes.title}</h3>
      <ul className="mt-5 flex flex-wrap gap-2.5">
        {classes.items.map((name) => (
          <li key={name} className="rounded-[3px] border border-white/20 px-4 py-2.5 text-[15px] font-medium text-text-hi">
            {name}
          </li>
        ))}
      </ul>
      {classes.note.trim() && <p className="mt-4 max-w-2xl font-light leading-relaxed text-text-lo">{classes.note}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        {contact.facebookHref && (
          <CtaLink href={contact.facebookHref} variant="secondary" external>
            Facebook {contact.facebookName}
          </CtaLink>
        )}
        <CtaLink href={contact.lineHref} variant="secondary" external>
          {content.ui.addLine} {contact.lineId}
        </CtaLink>
      </div>
    </div>
  );
}

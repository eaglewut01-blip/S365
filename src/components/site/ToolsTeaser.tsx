import type { SiteContent } from "@/lib/site-content";
import { Container, SectionHeader } from "./primitives";
import { ToolCards } from "./pages/ToolPages";
import { localizedPath } from "./SiteNav";

export function ToolsTeaser({ content }: { content: SiteContent }) {
  const { ui, locale } = content;
  return (
    <section id="tools" className="scroll-mt-20 py-16 md:py-24">
      <Container>
        <SectionHeader eyebrow={ui.toolsEyebrow} title={ui.toolsTitle}>
          {ui.toolsDesc}
        </SectionHeader>
        <div className="mt-9">
          <ToolCards locale={locale} readyOnly />
        </div>
        <a href={localizedPath(locale, "/tools")} className="mt-6 inline-block text-text-lo underline underline-offset-4 transition hover:text-volt">
          {ui.allTools}
        </a>
      </Container>
    </section>
  );
}

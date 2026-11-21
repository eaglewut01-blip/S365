import type { Metadata } from "next";
import { guideIntro, homeExercises, stretches, warmups } from "@/content/guides";
import { SITE_NAME } from "@/content/site";
import type { SiteContent } from "@/lib/site-content";
import type { Locale } from "@/content/site-texts";
import { comingSoon, toolPages, tools, type ToolPageId } from "@/content/tools";
import { localizedPath } from "../SiteNav";
import { SubPage } from "../SubPage";
import { BmiCalculator } from "../tools/BmiCalculator";
import { GuideList } from "../tools/GuideList";
import { WorkoutPlanner } from "../tools/WorkoutPlanner";

// Title, description and language alternates for a tool or guide page.
export function toolMetadata(locale: Locale, id: ToolPageId): Metadata {
  const page = toolPages[id];
  return {
    title: `${page.title[locale]} | ${SITE_NAME}`,
    description: page.intro[locale],
    alternates: {
      canonical: localizedPath(locale, page.path),
      languages: { th: localizedPath("th", page.path), en: localizedPath("en", page.path) },
    },
  };
}

function Frame({
  locale,
  id,
  children,
}: {
  locale: Locale;
  id: ToolPageId;
  children: React.ReactNode | ((content: SiteContent) => React.ReactNode);
}) {
  const page = toolPages[id];
  return (
    <SubPage
      locale={locale}
      path={page.path}
      eyebrow={page.eyebrow}
      title={page.title[locale]}
      intro={page.intro[locale]}
      back={id !== "hub"}
      healthNote={id !== "hub"}
    >
      {children}
    </SubPage>
  );
}

export function ToolCards({ locale, readyOnly }: { locale: Locale; readyOnly?: boolean }) {
  const list = readyOnly ? tools.filter((tool) => tool.ready !== false) : tools;
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 md:gap-3.5 lg:grid-cols-3">
      {list.map((tool) => {
        const body = (
          <>
            <p className="font-heading text-[15px] tracking-[0.24em] text-volt">{tool.tag}</p>
            <h3 className="mt-1 text-xl font-semibold text-text-hi">{tool.title[locale]}</h3>
            <p className="mt-1.5 font-light leading-relaxed text-text-lo">{tool.desc[locale]}</p>
          </>
        );
        return (
          <li key={tool.id}>
            {tool.ready === false ? (
              <div className="h-full rounded-[3px] border border-dashed border-white/15 p-5 opacity-70 md:p-6">
                {body}
                <p className="mt-3 text-sm text-text-faint">{comingSoon[locale]}</p>
              </div>
            ) : (
              <a
                href={localizedPath(locale, tool.path)}
                className="block h-full rounded-[3px] bg-[#111112] p-5 ring-1 ring-white/[0.06] transition hover:ring-volt md:p-6"
              >
                {body}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ToolsHubPage({ locale }: { locale: Locale }) {
  return (
    <Frame locale={locale} id="hub">
      <ToolCards locale={locale} />
    </Frame>
  );
}

export function BmiPage({ locale }: { locale: Locale }) {
  return (
    <Frame locale={locale} id="bmi">
      {(content) => <BmiCalculator locale={locale} lineId={content.contact.lineId} lineHref={content.contact.lineHref} />}
    </Frame>
  );
}

export function WorkoutPlanPage({ locale }: { locale: Locale }) {
  return (
    <Frame locale={locale} id="workout">
      {(content) => <WorkoutPlanner locale={locale} lineId={content.contact.lineId} lineHref={content.contact.lineHref} />}
    </Frame>
  );
}

export function HomeWorkoutPage({ locale }: { locale: Locale }) {
  return (
    <Frame locale={locale} id="home">
      <GuideList locale={locale} rules={guideIntro.home.rules[locale]} items={homeExercises} />
    </Frame>
  );
}

export function WarmupPage({ locale }: { locale: Locale }) {
  return (
    <Frame locale={locale} id="warmup">
      <GuideList locale={locale} rules={guideIntro.warmup.rules[locale]} items={warmups} />
    </Frame>
  );
}

export function StretchingPage({ locale }: { locale: Locale }) {
  return (
    <Frame locale={locale} id="stretch">
      <GuideList locale={locale} rules={guideIntro.stretch.rules[locale]} items={stretches} />
    </Frame>
  );
}

import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { itemClip, itemImage, itemLines, itemText, type ItemData, type StoredImage } from "@/content/collections";
import { SITE_NAME } from "@/content/site";
import type { Locale } from "@/content/site-texts";
import { uiStrings } from "@/content/ui-strings";
import { publicPhotoUrl, type SiteContent } from "@/lib/site-content";
import { getItemBySlug, getItems, type SiteItem } from "@/lib/site-items";
import { ClipPreview } from "../ClipPreview";
import { Container, CtaLink, SectionHeader } from "../primitives";
import { localizedPath } from "../SiteNav";
import { SubPage } from "../SubPage";

const pageMeta = {
  videos: { path: "/videos", title: "videosTitle", desc: "videosDesc" },
  machines: { path: "/machines", title: "machinesTitle", desc: "machinesDesc" },
  articles: { path: "/articles", title: "articlesTitle", desc: "articlesDesc" },
  shop: { path: "/shop", title: "shopTitle", desc: "shopDesc" },
} as const;

export function contentMetadata(locale: Locale, id: keyof typeof pageMeta): Metadata {
  const page = pageMeta[id];
  const ui = uiStrings[locale];
  return {
    title: `${ui[page.title]} | ${SITE_NAME}`,
    description: ui[page.desc],
    alternates: {
      canonical: localizedPath(locale, page.path),
      languages: { th: localizedPath("th", page.path), en: localizedPath("en", page.path) },
    },
  };
}

/** Route params can arrive percent-encoded (Thai slugs); decode them once. */
export function slugParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function Photo({ image, alt, sizes, className }: { image: StoredImage; alt: string; sizes: string; className?: string }) {
  return (
    <Image src={publicPhotoUrl(image.path)} alt={alt} width={image.width} height={image.height} sizes={sizes} className={className} />
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[3px] border border-dashed border-white/15 p-6 font-light text-text-lo">{children}</p>;
}

// ---------- Clips ----------

function platformName(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("facebook") || host === "fb.watch" || host === "fb.com") return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("youtube") || host === "youtu.be") return "YouTube";
  } catch {
    // Not a valid URL: fall through to the generic label.
  }
  return null;
}

function VideoGrid({ items, locale }: { items: SiteItem[]; locale: Locale }) {
  const ui = uiStrings[locale];
  return (
    <ul className="grid grid-cols-2 gap-2.5 md:gap-3.5 lg:grid-cols-4">
      {items.map((item) => {
        const title = itemText(item.data, "title", locale);
        const url = String(item.data.url ?? "");
        const clip = itemClip(item.data, "clip");
        const cover = itemImage(item.data, "cover") ?? clip?.poster ?? null;
        const platform = platformName(url);
        return (
          <li key={item.id}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${title}. ${platform ? `${ui.watchOn} ${platform}` : ui.watchFull}`}
              className="group relative block aspect-[9/16] overflow-hidden rounded-[3px] bg-[#111112]"
            >
              {clip ? (
                <ClipPreview
                  src={publicPhotoUrl(clip.path)}
                  poster={cover ? publicPhotoUrl(cover.path) : undefined}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : cover ? (
                <Photo image={cover} alt="" sizes="(min-width: 1024px) 290px, 50vw" className="absolute inset-0 size-full object-cover" />
              ) : null}
              <div aria-hidden className="tile-shade absolute inset-0" />
              <span
                aria-hidden
                className="absolute left-3 top-3 flex size-10 items-center justify-center rounded-full bg-volt text-volt-ink transition group-hover:scale-110 motion-reduce:transition-none"
              >
                <svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-current">
                  <path d="M6 4l14 8-14 8z" />
                </svg>
              </span>
              <div className="absolute inset-x-3 bottom-3">
                {platform && <p className="font-heading text-[13px] tracking-[0.24em] text-volt">{platform.toUpperCase()}</p>}
                <p className="text-[15px] font-medium leading-snug text-text-hi md:text-[17px]">{title}</p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

// Home page band: up to four clips the owner marked for the home page. Renders nothing until there is one.
export async function VideosSection({ content }: { content: SiteContent }) {
  const { ui, locale } = content;
  const items = (await getItems("videos")).filter((item) => item.data.home === true).slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section id="clips" className="scroll-mt-20 py-16 md:py-24">
      <Container>
        <SectionHeader eyebrow={ui.videosEyebrow} title={ui.videosTitle}>
          {ui.videosDesc}
        </SectionHeader>
        <div className="mt-9">
          <VideoGrid items={items} locale={locale} />
        </div>
        <a href={localizedPath(locale, "/videos")} className="mt-6 inline-block text-text-lo underline underline-offset-4 transition hover:text-volt">
          {ui.seeAll}
        </a>
      </Container>
    </section>
  );
}

export async function VideosPage({ locale }: { locale: Locale }) {
  const ui = uiStrings[locale];
  const items = await getItems("videos");
  return (
    <SubPage locale={locale} path="/videos" eyebrow={ui.videosEyebrow} title={ui.videosTitle} intro={ui.videosDesc}>
      {items.length === 0 ? <Empty>{ui.videosEmpty}</Empty> : <VideoGrid items={items} locale={locale} />}
    </SubPage>
  );
}

// ---------- Machine guides ----------

export async function MachinesPage({ locale }: { locale: Locale }) {
  const ui = uiStrings[locale];
  const items = await getItems("machines");
  const zones = new Map<string, SiteItem[]>();
  for (const item of items) {
    const zone = String(item.data.zone ?? "").trim() || ui.otherZone;
    zones.set(zone, [...(zones.get(zone) ?? []), item]);
  }

  return (
    <SubPage locale={locale} path="/machines" eyebrow={ui.machinesEyebrow} title={ui.machinesTitle} intro={ui.machinesDesc} back>
      {items.length === 0 ? (
        <Empty>{ui.machinesEmpty}</Empty>
      ) : (
        <div className="space-y-10">
          {[...zones].map(([zone, list]) => (
            <section key={zone}>
              <h2 className="text-xl font-semibold text-text-hi">{zone}</h2>
              <ul className="mt-4 grid grid-cols-2 gap-2.5 md:gap-3.5 lg:grid-cols-4">
                {list.map((item) => {
                  const image = itemImage(item.data, "photo") ?? itemClip(item.data, "clip")?.poster ?? null;
                  return (
                    <li key={item.id}>
                      <a
                        href={localizedPath(locale, `/machines/${item.slug}`)}
                        className="block h-full overflow-hidden rounded-[3px] bg-[#111112] ring-1 ring-white/[0.06] transition hover:ring-volt"
                      >
                        <div className="relative aspect-[4/3] bg-black">
                          {image && <Photo image={image} alt="" sizes="(min-width: 1024px) 290px, 50vw" className="absolute inset-0 size-full object-cover" />}
                        </div>
                        <div className="p-3.5 md:p-4">
                          <h3 className="font-semibold leading-snug text-text-hi md:text-lg">{itemText(item.data, "name", locale)}</h3>
                          <p className="mt-0.5 text-sm font-light text-text-lo">{itemText(item.data, "muscles", locale)}</p>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </SubPage>
  );
}

export async function machineMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const item = await getItemBySlug("machines", slug);
  if (!item) return {};
  const path = `/machines/${slug}`;
  return {
    title: `${itemText(item.data, "name", locale)} | ${SITE_NAME}`,
    description: itemLines(itemText(item.data, "steps", locale)).slice(0, 2).join(" "),
    alternates: { canonical: localizedPath(locale, path), languages: { th: localizedPath("th", path), en: localizedPath("en", path) } },
  };
}

export async function MachinePage({ locale, slug }: { locale: Locale; slug: string }) {
  const ui = uiStrings[locale];
  const item = await getItemBySlug("machines", slug);
  if (!item) notFound();

  const data: ItemData = item.data;
  const name = itemText(data, "name", locale);
  const clip = itemClip(data, "clip");
  const photo = itemImage(data, "photo");
  const steps = itemLines(itemText(data, "steps", locale));
  const tip = itemText(data, "tip", locale);
  const muscles = itemText(data, "muscles", locale);
  const url = typeof data.url === "string" ? data.url : "";

  return (
    <SubPage locale={locale} path={`/machines/${slug}`} eyebrow={ui.machinesEyebrow} title={name} healthNote>
      <a href={localizedPath(locale, "/machines")} className="-mt-4 mb-6 block text-sm text-text-lo transition hover:text-volt">
        ← {ui.allMachines}
        {typeof data.zone === "string" && data.zone.trim() && ` · ${data.zone.trim()}`}
      </a>
      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="overflow-hidden rounded-[3px] bg-black">
          {clip ? (
            // The visitor is standing at the machine: give them real controls and sound, not a silent loop.
            <video
              src={publicPhotoUrl(clip.path)}
              poster={clip.poster ? publicPhotoUrl(clip.poster.path) : photo ? publicPhotoUrl(photo.path) : undefined}
              controls
              playsInline
              preload="metadata"
              className="max-h-[70vh] w-full"
            />
          ) : photo ? (
            <Photo image={photo} alt={name} sizes="(min-width: 1024px) 420px, 100vw" className="h-auto w-full" />
          ) : null}
        </div>

        <div className="rounded-[3px] bg-[#111112] p-5 md:p-7">
          {muscles && (
            <p className="text-pretty text-text-lo">
              <span className="font-medium text-volt">{ui.muscles}: </span>
              {muscles}
            </p>
          )}
          <h2 className="mt-4 text-lg font-semibold text-text-hi">{ui.steps}</h2>
          <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-[1.05rem] leading-relaxed text-text-hi marker:font-semibold marker:text-volt">
            {steps.map((step) => (
              <li key={step} className="pl-1 font-light">
                {step}
              </li>
            ))}
          </ol>
          {tip && (
            <p className="mt-5 border-l-2 border-volt/60 pl-3 font-light leading-relaxed text-text-lo">
              <span className="font-medium text-text-hi">{ui.caution}: </span>
              {tip}
            </p>
          )}
          {url && (
            <CtaLink href={url} variant="secondary" external className="mt-6">
              {platformName(url) ? `${ui.watchOn} ${platformName(url)}` : ui.watchFull}
            </CtaLink>
          )}
        </div>
      </div>
    </SubPage>
  );
}

// ---------- Articles ----------

// English visitors only see articles that have an English title.
function articlesFor(items: SiteItem[], locale: Locale) {
  return locale === "en" ? items.filter((item) => typeof item.data.title_en === "string" && item.data.title_en.trim()) : items;
}

function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { dateStyle: "long", timeZone: "Asia/Bangkok" }).format(new Date(iso));
}

function ArticleCards({ items, locale }: { items: SiteItem[]; locale: Locale }) {
  return (
    <ul className="grid gap-2.5 md:grid-cols-2 md:gap-3.5 lg:grid-cols-3">
      {items.map((item) => {
        const cover = itemImage(item.data, "cover");
        return (
          <li key={item.id}>
            <a
              href={localizedPath(locale, `/articles/${item.slug}`)}
              className="block h-full overflow-hidden rounded-[3px] bg-[#111112] ring-1 ring-white/[0.06] transition hover:ring-volt"
            >
              {cover && (
                <div className="relative aspect-[16/9]">
                  <Photo image={cover} alt="" sizes="(min-width: 1024px) 390px, (min-width: 768px) 50vw, 100vw" className="absolute inset-0 size-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <p className="text-sm text-text-faint">{formatDate(item.createdAt, locale)}</p>
                <h3 className="mt-1 text-xl font-semibold leading-snug text-balance text-text-hi">{itemText(item.data, "title", locale)}</h3>
                <p className="mt-2 line-clamp-3 font-light leading-relaxed text-text-lo">{itemText(item.data, "excerpt", locale)}</p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

// Home page band with the three newest articles. Renders nothing until there is one.
export async function ArticlesSection({ content }: { content: SiteContent }) {
  const { ui, locale } = content;
  const items = articlesFor(await getItems("articles"), locale).slice(0, 3);
  if (items.length === 0) return null;
  return (
    <section id="articles" className="scroll-mt-20 bg-[#111112] py-16 md:py-24">
      <Container>
        <SectionHeader eyebrow={ui.articlesEyebrow} title={ui.articlesTitle}>
          {ui.articlesDesc}
        </SectionHeader>
        <div className="mt-9 [&_a]:bg-base">
          <ArticleCards items={items} locale={locale} />
        </div>
        <a href={localizedPath(locale, "/articles")} className="mt-6 inline-block text-text-lo underline underline-offset-4 transition hover:text-volt">
          {ui.allArticles}
        </a>
      </Container>
    </section>
  );
}

export async function ArticlesPage({ locale }: { locale: Locale }) {
  const ui = uiStrings[locale];
  const items = articlesFor(await getItems("articles"), locale);
  return (
    <SubPage locale={locale} path="/articles" eyebrow={ui.articlesEyebrow} title={ui.articlesTitle} intro={ui.articlesDesc}>
      {items.length === 0 ? <Empty>{ui.articlesEmpty}</Empty> : <ArticleCards items={items} locale={locale} />}
    </SubPage>
  );
}

export async function articleMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const item = await getItemBySlug("articles", slug);
  if (!item) return {};
  const path = `/articles/${slug}`;
  const cover = itemImage(item.data, "cover");
  return {
    title: `${itemText(item.data, "title", locale)} | ${SITE_NAME}`,
    description: itemText(item.data, "excerpt", locale) || undefined,
    alternates: { canonical: localizedPath(locale, path), languages: { th: localizedPath("th", path), en: localizedPath("en", path) } },
    openGraph: cover ? { images: [{ url: publicPhotoUrl(cover.path), width: cover.width, height: cover.height }] } : undefined,
  };
}

// The article body uses three plain-text conventions the owner types in the
// back office: a blank line starts a paragraph, "## " starts a sub-heading
// and "- " starts a list item. Everything is rendered as text, never as HTML.
function ArticleBody({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="max-w-[68ch] space-y-5 text-[1.08rem] font-light leading-[1.85] text-[#dedcd4]">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((line) => line.trim());
        if (lines[0].startsWith("## ")) {
          return (
            <div key={i} className="space-y-3 pt-3">
              <h2 className="text-2xl font-semibold leading-snug text-text-hi">{lines[0].slice(3)}</h2>
              {lines.length > 1 && <p className="whitespace-pre-line">{lines.slice(1).join("\n")}</p>}
            </div>
          );
        }
        if (lines.every((line) => /^[-•]\s+/.test(line))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-volt">
              {lines.map((line) => (
                <li key={line}>{line.replace(/^[-•]\s+/, "")}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export async function ArticlePage({ locale, slug }: { locale: Locale; slug: string }) {
  const ui = uiStrings[locale];
  const item = await getItemBySlug("articles", slug);
  if (!item || articlesFor([item], locale).length === 0) notFound();

  const cover = itemImage(item.data, "cover");
  const author = typeof item.data.author === "string" ? item.data.author : "";
  const title = itemText(item.data, "title", locale);
  return (
    <SubPage locale={locale} path={`/articles/${slug}`} eyebrow={ui.articlesEyebrow} title={title} intro={itemText(item.data, "excerpt", locale)}>
      <p className="-mt-4 mb-7 text-sm text-text-faint">
        {formatDate(item.createdAt, locale)}
        {author && ` · ${ui.by} ${author}`}
      </p>
      {cover && <Photo image={cover} alt="" sizes="(min-width: 1024px) 900px, 100vw" className="mb-8 h-auto w-full max-w-[900px] rounded-[3px]" />}
      <ArticleBody text={itemText(item.data, "body", locale)} />
      <a href={localizedPath(locale, "/articles")} className="mt-10 inline-block text-text-lo underline underline-offset-4 transition hover:text-volt">
        ← {ui.allArticles}
      </a>
    </SubPage>
  );
}

// ---------- Shop ----------

export async function ShopPage({ locale }: { locale: Locale }) {
  const ui = uiStrings[locale];
  const items = await getItems("products");
  const price = (value: unknown) => Number(value).toLocaleString(locale === "th" ? "th-TH" : "en-US");

  return (
    <SubPage locale={locale} path="/shop" eyebrow={ui.shopEyebrow} title={ui.shopTitle} intro={ui.shopDesc}>
      {(content) =>
        items.length === 0 ? (
          <Empty>{ui.shopEmpty}</Empty>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 md:gap-3.5 lg:grid-cols-4">
            {items.map((item) => {
              const photo = itemImage(item.data, "photo");
              const name = itemText(item.data, "name", locale);
              const now = Number(item.data.price);
              const before = Number(item.data.old_price);
              const discount = before > now ? Math.round((1 - now / before) * 100) : 0;
              const soldOut = item.data.sold_out === true;
              const orderUrl = typeof item.data.url === "string" && item.data.url ? item.data.url : content.contact.lineHref;
              return (
                <li key={item.id} className="flex flex-col overflow-hidden rounded-[3px] bg-[#111112]">
                  <div className="relative aspect-square bg-white">
                    {photo && <Photo image={photo} alt={name} sizes="(min-width: 1024px) 290px, 50vw" className="absolute inset-0 size-full object-contain" />}
                    {discount > 0 && !soldOut && (
                      <span className="absolute right-2 top-2 rounded-[3px] bg-coral px-2 py-0.5 text-sm font-semibold text-white">-{discount}%</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3.5 md:p-4">
                    {typeof item.data.category === "string" && (
                      <p className="font-heading text-[13px] tracking-[0.22em] text-volt">{item.data.category}</p>
                    )}
                    <h2 className="font-medium leading-snug text-text-hi">{name}</h2>
                    <p className="mt-1 line-clamp-3 text-sm font-light leading-relaxed text-text-lo">{itemText(item.data, "desc", locale)}</p>
                    <p className="mt-auto pt-3 tabular-nums">
                      {discount > 0 && <s className="mr-2 text-sm text-text-faint">{price(before)}</s>}
                      <span className="text-xl font-semibold text-text-hi">{price(now)}</span>
                      <span className="ml-1 text-sm text-text-lo">{ui.baht}</span>
                    </p>
                    {soldOut ? (
                      <span className="mt-3 rounded-[3px] border border-white/15 py-2.5 text-center text-sm text-text-faint">{ui.soldOut}</span>
                    ) : (
                      <a
                        href={orderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 rounded-[3px] bg-volt py-2.5 text-center text-[15px] font-semibold text-volt-ink transition hover:brightness-110"
                      >
                        {orderUrl === content.contact.lineHref ? ui.orderLine : ui.order}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      }
    </SubPage>
  );
}

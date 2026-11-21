import { ArticlePage, articleMetadata, slugParam } from "@/components/site/pages/ContentPages";

type Props = { params: Promise<{ slug: string }> };

// Pages are built the first time someone opens them, then cached like the rest of the site.
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props) {
  return articleMetadata("en", slugParam((await params).slug));
}

export default async function Page({ params }: Props) {
  return <ArticlePage locale="en" slug={slugParam((await params).slug)} />;
}

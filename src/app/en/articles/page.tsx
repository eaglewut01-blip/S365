import { ArticlesPage, contentMetadata } from "@/components/site/pages/ContentPages";

export const metadata = contentMetadata("en", "articles");

// Prerendered; the owner's edits in the back office refresh it straight away.
export const revalidate = 300;

export default function Page() {
  return <ArticlesPage locale="en" />;
}

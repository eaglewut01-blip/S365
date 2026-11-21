import { VideosPage, contentMetadata } from "@/components/site/pages/ContentPages";

export const metadata = contentMetadata("en", "videos");

// Prerendered; the owner's edits in the back office refresh it straight away.
export const revalidate = 300;

export default function Page() {
  return <VideosPage locale="en" />;
}

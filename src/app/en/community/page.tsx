import { CommunityPage, menuMetadata } from "@/components/site/pages/MenuPages";

export const generateMetadata = () => menuMetadata("en", "community");

// Prerendered; the owner's edits in the back office refresh it straight away.
export const revalidate = 300;

export default function Page() {
  return <CommunityPage locale="en" />;
}

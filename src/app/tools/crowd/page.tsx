import { CrowdPage, crowdMetadata } from "@/components/site/pages/CrowdPage";

export const metadata = crowdMetadata("th");

// Counts change through the day: rebuild at most once a minute.
export const revalidate = 60;

export default function Page() {
  return <CrowdPage locale="th" />;
}

import { BmiPage, toolMetadata } from "@/components/site/pages/ToolPages";

export const metadata = toolMetadata("en", "bmi");

// Prerendered; refreshed with the rest of the site when the owner edits contact details.
export const revalidate = 300;

export default function Page() {
  return <BmiPage locale="en" />;
}

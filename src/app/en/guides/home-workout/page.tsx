import { HomeWorkoutPage, toolMetadata } from "@/components/site/pages/ToolPages";

export const metadata = toolMetadata("en", "home");

// Prerendered; refreshed with the rest of the site when the owner edits contact details.
export const revalidate = 300;

export default function Page() {
  return <HomeWorkoutPage locale="en" />;
}

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/session";

const ROLE_HOME: Record<string, string> = {
  owner: "/owner",
  staff: "/owner",
  trainer: "/trainer",
  member: "/member",
};

export default async function Home() {
  const profile = await getCurrentProfile();
  redirect(profile ? ROLE_HOME[profile.role] ?? "/login" : "/login");
}

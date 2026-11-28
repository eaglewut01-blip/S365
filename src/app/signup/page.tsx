import { adminKeyProblem } from "@/lib/supabase/admin";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "สมัครบัญชีทีมงาน | S365 Fitness" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  return <SignupForm notReady={!!(await adminKeyProblem())} />;
}

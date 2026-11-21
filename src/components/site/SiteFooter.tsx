import Link from "next/link";
import { SITE_NAME } from "@/content/site";
import { Container, Wordmark } from "./primitives";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] pb-28 pt-9 md:pb-9">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark className="text-[13px]" />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-faint">
          <span>
            © {new Date().getFullYear()} {SITE_NAME}
          </span>
          <Link href="/login" className="text-text-lo transition hover:text-text-hi">
            เข้าสู่ระบบสมาชิกและทีมงาน
          </Link>
        </div>
      </Container>
    </footer>
  );
}

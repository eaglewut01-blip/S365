import Link from "next/link";
import { site } from "@/content/site";
import { Container, DigitWall, Wordmark } from "./primitives";

export function SiteFooter() {
  return (
    <footer className="py-12">
      <Container>
        <DigitWall className="text-[11vw] md:text-[5.5rem]" />
        <div className="mt-10 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark className="text-[15px]" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-faint">
            <span>
              © {new Date().getFullYear()} {site.name}
            </span>
            <Link href="/login" className="text-text-lo transition hover:text-text-hi">
              เข้าสู่ระบบสมาชิกและทีมงาน
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

import { Kanit } from "next/font/google";

// Thai display and body face for every public page.
export const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

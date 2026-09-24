import type { Metadata } from "next";
import { Tajawal, Cairo, Marcellus } from "next/font/google";
import { LocaleProvider } from "@/lib/locale-context";
import { ServicesUIProvider } from "@/lib/services-ui-context";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "White Moon Medical Complex | مجمع وايت مون الطبي",
  description:
    "White Moon Medical Complex in Taif — dentistry, dermatology and laser care under one roof. مجمع طبي متخصص في طب الأسنان والجلدية والليزر بالطائف.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${cairo.variable} ${marcellus.variable}`}>
      <body className="antialiased">
        <LocaleProvider>
          <ServicesUIProvider>{children}</ServicesUIProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

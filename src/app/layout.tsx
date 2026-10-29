import type { Metadata } from "next";
import { Tajawal, Cairo, Marcellus } from "next/font/google";
import ImageGuard from "@/components/ImageGuard";
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

const description =
  "White Moon Medical Complex in Taif — dentistry, dermatology and laser care under one roof. مجمع طبي متخصص في طب الأسنان والجلدية والليزر بالطائف.";

// The link preview (WhatsApp, X, iMessage…): the card in public/og/ — each branch page sets its own.
export const metadata: Metadata = {
  metadataBase: new URL("https://whitemoonclinic.com"),
  title: "White Moon Medical Complex | مجمع وايت مون الطبي",
  description,
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "مجمع وايت مون الطبي | White Moon",
    title: "مجمع وايت مون الطبي — الطائف",
    description: "طب الأسنان، الجلدية والتجميل، الليزر، النساء والولادة، الأطفال — ثلاثة فروع في الطائف: الخمسين، شهار، الوسام.",
    url: "/",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630, alt: "مجمع وايت مون الطبي" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${cairo.variable} ${marcellus.variable}`}>
      <body className="antialiased">
        <ImageGuard />
        <LocaleProvider>
          <ServicesUIProvider>{children}</ServicesUIProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

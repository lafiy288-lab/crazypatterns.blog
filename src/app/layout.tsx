import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { getSettings, hexToRgb, darken } from "@/lib/settings";
import { SITE_URL } from "@/lib/utils";
import { PrefsProvider } from "@/components/site/prefs";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-poppins", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `${s.siteName} – ${s.tagline}`;
  const description = "Discover thousands of digital crochet, knitting, sewing, felting, embroidery and craft patterns from independent designers. Free patterns and video tutorials included.";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${s.siteName}` },
    description,
    applicationName: s.siteName,
    openGraph: { type: "website", siteName: s.siteName, title, description, images: [{ url: "/placeholders/og.webp", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: ["/placeholders/og.webp"] },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFBF5" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1720" },
  ],
};

// Applies the saved theme before paint to avoid a light/dark flash.
const themeScript = `try{var t=localStorage.getItem('pn-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const vars = `:root{--color-primary:${hexToRgb(s.colors.primary)};--color-primary-dark:${darken(s.colors.primary)};--color-accent:${hexToRgb(s.colors.accent)};--color-accent-strong:${darken(s.colors.accent, 0.3)};--color-bg:${hexToRgb(s.colors.background)};--color-text:${hexToRgb(s.colors.text)}}`;
  const accentInk = `:root:not(.dark){--color-accent-ink:${darken(s.colors.accent, 0.3)}}`;
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: vars + accentInk }} />
      </head>
      <body className="min-h-screen">
        <PrefsProvider>{children}</PrefsProvider>
      </body>
    </html>
  );
}

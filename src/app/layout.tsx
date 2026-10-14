import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for names, headings and figures — geometric and a touch warmer
// than the body font, so a person's name reads as a name and not as UI chrome.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TechTicks Academy | AI Automation LMS",
  description: "Modern Learning Management System for TechTicks AI Automation Academy",
};

/**
 * Resolves the theme before first paint: a stored choice wins, otherwise the
 * OS setting. It always writes a concrete value, so the CSS needs only one
 * night block and a night-mode visitor never sees a white flash.
 */
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","light")}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} antialiased`}>
        {/* Applies the stored/system theme ahead of hydration. A raw <script>
            inside a component is never executed on client renders and React
            warns about it, so this goes through next/script. */}
        <Script id="techticks-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}

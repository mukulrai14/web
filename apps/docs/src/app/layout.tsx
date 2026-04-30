import { Provider } from "@/components/provider";
import { getBaseUrl } from "@/lib/urls";
import "./global.css";
import { Inter, Barlow } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { FontAwesomeScript as EclipseFA } from "@prisma/eclipse";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

const monaSans = localFont({
  src: [
    {
      path: "../../../../packages/eclipse/src/static/fonts/MonaSansVF[wdth,wght,opsz,ital].woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "../../../../packages/eclipse/src/static/fonts/MonaSansVF[wdth,wght,opsz,ital].woff2",
      weight: "200 900",
      style: "italic",
    },
  ],
  variable: "--font-mona-sans",
  display: "swap",
});

const monaSansMono = localFont({
  src: "../../../../packages/eclipse/src/static/fonts/MonaSansMonoVF[wght].woff2",
  variable: "--font-mona-mono",
  display: "swap",
  weight: "200 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Prisma Documentation",
    template: "%s | Prisma Documentation",
  },
  description:
    "Documentation for Prisma ORM, Prisma Postgres, Prisma Accelerate, and the Prisma ecosystem. Build type-safe database applications with ease.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlow.variable} ${monaSans.variable} ${monaSansMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          src={EclipseFA}
          crossOrigin="anonymous"
          data-auto-add-css="false"
        />
        <Script
          src="https://ingest.promptwatch.com/js/client.min.js"
          strategy="afterInteractive"
          data-project-id="25f18e15-6306-4faa-b5c2-8078804778ac"
          data-cookieyes="cookieyes-analytics"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
        <Script
          async
          src="https://cdn.tolt.io/tolt.js"
          data-tolt="fda67739-7ed0-42d2-b716-6da0edbec191"
          data-cookieyes="cookieyes-analytics"
        />
        <Script
          async
          src="https://cdn-cookieyes.com/client_data/96980f76df67ad5235fc3f0d/script.js"
          id="cookieyes"
        />
      </body>
    </html>
  );
}

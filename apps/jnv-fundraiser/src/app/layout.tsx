import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navodaya Sahyog — verified community fund for JNV",
  description:
    "A closed, verified fundraising circle for Jawahar Navodaya Vidyalaya students, alumni, staff and their families. Every member is verified, every request is reviewed, every rupee is traceable.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-line">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-sm text-ink-muted">
            <p className="font-medium text-ink">
              Navodaya Sahyog · demo build, not a live fundraising platform
            </p>
            <p className="max-w-3xl">
              This is a prototype. No payment gateway is connected, no documents are stored and no
              money moves. The names, cases and receipts are fictional. Before running anything like
              this for real, read the{" "}
              <Link href="/legal" className="underline">
                legal and compliance notes
              </Link>{" "}
              and get advice from a chartered accountant and a lawyer.
            </p>
            <p>
              Jawahar Navodaya Vidyalaya and Navodaya Vidyalaya Samiti are institutions of the
              Government of India. This demo is not affiliated with or endorsed by NVS.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

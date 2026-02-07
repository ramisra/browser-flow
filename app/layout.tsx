import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Browser Flow — Stop switching apps. Start staying in flow.",
  description:
    "AI agents turn your browsing into organized work across your productivity stack. Smart Tab Orchestra, Productivity Hub, Universal Workspace, Intent-to-Action Automation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


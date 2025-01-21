import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Veteran Timeline - Military Transition Planning Tool",
  description: "Free military transition planning tool for service members. Create personalized timelines for separation, terminal leave, SkillBridge, VA claims, and job search. Built by veterans for a successful military to civilian transition.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png" }
    ]
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Veteran Timeline - Military Transition Planning Tool",
    description: "Free military transition planning tool for service members. Create personalized timelines for separation, terminal leave, SkillBridge, VA claims, and job search. Built by veterans for a successful military to civilian transition.",
    url: "https://app.veterantimeline.com",
    siteName: "Veteran Timeline",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Veteran Timeline Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veteran Timeline - Military Transition Planning Tool",
    description: "Free military transition planning tool for service members. Create personalized timelines for separation, terminal leave, SkillBridge, VA claims, and job search. Built by veterans for a successful military to civilian transition.",
    images: ["/android-chrome-512x512.png"],
    creator: "@veterantimeline",
  },
  metadataBase: new URL("https://app.veterantimeline.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
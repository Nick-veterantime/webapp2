import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Veteran Timeline - Military Transition Planning Tool",
  description: "Free military transition planning tool for service members. Create personalized timelines for separation, terminal leave, SkillBridge, VA claims, and job search. Built by veterans for a successful military to civilian transition.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/Frame%2029.png", type: "image/png" }
    ],
    apple: [
      { url: "/images/Frame%2029.png" }
    ]
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Veteran Timeline - Military Transition Planning Tool",
    description: "Free military transition planning tool for service members. Create personalized timelines for separation, terminal leave, SkillBridge, VA claims, and job search. Built by veterans for a successful military to civilian transition.",
    url: "https://veterantimeline.com",
    siteName: "Veteran Timeline",
    images: [
      {
        url: "/images/Frame%2029.png",
        width: 1200,
        height: 630,
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
    images: ["/images/Frame%2029.png"],
    creator: "@veterantimeline",
  },
  metadataBase: new URL("https://veterantimeline.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
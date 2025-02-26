import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Veteran Timeline - Military Transition Planning Tool",
  description: "Free military transition planning tool for service members. Create personalized timelines for separation, terminal leave, SkillBridge, VA claims, and job search. Built by veterans for a successful military to civilian transition.",
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
      <body className={inter.className}>
        {children}
        <Toaster 
          richColors 
          position="top-right" 
          closeButton 
          toastOptions={{
            duration: 5000, // 5 seconds default duration
            style: { maxWidth: '500px' }
          }}
        />
      </body>
    </html>
  );
}
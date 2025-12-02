import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "../components/Header";
import { LanguageProvider } from "../components/LanguageProvider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "Matcha - AI-Powered Psychological Insights",
    template: "%s | Matcha",
  },
  description:
    "Discover your cognitive biases, understand your emotional patterns, and unlock personal growth with Matcha's AI-powered psychological analysis. Get real-time insights during conversations.",
  keywords: [
    "psychology AI",
    "cognitive bias detection",
    "emotional intelligence",
    "personal development",
    "psychological analysis",
    "mental wellness",
    "self-awareness",
    "AI therapy assistant",
    "thought pattern analysis",
    "mindfulness AI",
  ],
  authors: [{ name: "Matcha" }],
  creator: "Matcha",
  publisher: "Matcha",
  metadataBase: new URL("https://vematcha.xyz"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Matcha - AI-Powered Psychological Insights",
    description:
      "Understand your mind with AI. Detect cognitive biases, track emotional patterns, and get personalized insights for personal growth.",
    type: "website",
    locale: "en_US",
    url: "https://vematcha.xyz",
    siteName: "Matcha",
  },
  twitter: {
    card: "summary_large_image",
    title: "Matcha - AI-Powered Psychological Insights",
    description:
      "Understand your mind with AI. Detect cognitive biases and get personalized insights.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${dmSerif.variable} antialiased min-h-screen`}
        style={{
          background: "var(--bg-page)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        }}
      >
        <ClerkProvider>
          <LanguageProvider>
            <div className="sticky top-0 z-50">
              <Header />
            </div>
            <main>{children}</main>
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

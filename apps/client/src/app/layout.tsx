import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "../components/Header";
import { LanguageProvider } from "../components/LanguageProvider";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-X3NN5L7W36";
const FB_PIXEL_ID = "1621282909251748";

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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://vematcha.xyz/#website",
                  "url": "https://vematcha.xyz",
                  "name": "Matcha",
                  "description": "AI-Powered Psychological Insights",
                  "publisher": { "@id": "https://vematcha.xyz/#organization" },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://vematcha.xyz/?s={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://vematcha.xyz/#organization",
                  "name": "Matcha",
                  "url": "https://vematcha.xyz",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://vematcha.xyz/favicon/favicon-96x96.png"
                  },
                  "sameAs": []
                },
                {
                  "@type": "SoftwareApplication",
                  "name": "Matcha",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "Web",
                  "description": "AI-powered psychological analysis tool that helps you understand cognitive biases, emotional patterns, and unlock personal growth through real-time insights.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "description": "Free tier with 50 messages/month"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "ratingCount": "150"
                  }
                }
              ]
            })
          }}
        />
      </head>
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

import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Geist_Mono, Outfit } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeColorSync } from "@/components/theme-color-sync"
import { PwaRegister } from "@/components/pwa-register"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  applicationName: "Tank Tracker",
  title: {
    default: "Tank Tracker",
    template: "%s · Tank Tracker",
  },
  description: "Reef parameter logging, water-change reminders, and livestock compatibility.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tank Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1214" },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col overflow-x-clip antialiased">
        <ThemeProvider>
          <ThemeColorSync />
          {children}
          <Toaster />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  )
}

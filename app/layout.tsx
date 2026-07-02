import React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Convivencia con Dios - Plataforma digital",
  description:
    "Plataforma para la gestión de la comunidad de Convivencia con Dios",
  icons: {
    icon: "/logoccd.jpeg",
    apple: "/logoccd.jpeg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('font-size-preference')||'small';var m={small:1,medium:1.125,large:1.25};document.documentElement.style.setProperty('--font-scale',m[s]||1);})();`,
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

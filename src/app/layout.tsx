import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import '@/styles/globals.css'
import { BottomNav } from '@/components/layout/BottomNav'
import { OfflineBanner } from '@/components/feedback/OfflineBanner'
import { GlobalProviders } from '@/components/providers/GlobalProviders'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Vokabeltrainer',
  description: 'Lerne Vokabeln mit Karteikarten und intelligenter Wiederholung',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vokabeltrainer',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">
        <OfflineBanner />
        <NextIntlClientProvider messages={messages}>
          <GlobalProviders>
            {children}
          </GlobalProviders>
        </NextIntlClientProvider>
        <BottomNav />
      </body>
    </html>
  )
}

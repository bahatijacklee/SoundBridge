import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'SoundBridge - Connecting Sound, Creating Opportunity',
  description: 'Engage with your favorite artists, complete simple tasks, and earn real rewards on SoundBridge',
  generator: 'v0.app',
  icons: {
    icon: '/brand-icon.svg',
    apple: '/apple-icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-slate-950">
      <body className="font-sans antialiased bg-slate-950 text-white">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

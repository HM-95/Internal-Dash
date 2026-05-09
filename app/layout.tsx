import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Haven Influence - Health & Wellness Creator Platform',
  description: 'Health and wellness creator marketing made effortless, fast and targeted',
  icons: {
    icon: '/haven-influence-icon.svg',
    apple: '/haven-influence-icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
} // Force fresh deployment Tue Aug 12 11:38:08 CEST 2025

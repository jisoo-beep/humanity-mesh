import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Humanity Mesh',
  description: 'AI 기반 스토리텔링을 통한 탈북 청소년 리터러시 향상 및 정체성 형성 지원',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-white text-slate-800 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

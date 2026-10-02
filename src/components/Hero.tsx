'use client'

import { useI18n } from '@/lib/i18n'
import { ChevronDown } from 'lucide-react'

export default function Hero() {
  const { t, lang } = useI18n()

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px)'
        }} />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p className="text-xs tracking-[0.3em] uppercase text-slate-400 mb-6">
          {lang === 'ko' ? '익명 스토리 아카이브' : 'ANONYMOUS STORY ARCHIVE'}
        </p>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6">
          <span className="block">Humanity</span>
          <span className="block text-slate-300">Mesh</span>
        </h1>

        <div className="w-16 h-px bg-slate-500 mx-auto my-8" />

        <p className="text-lg md:text-xl text-slate-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
          {t.hero.tagline}
        </p>
      </div>

      <button
        onClick={() => document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 hover:text-white transition-colors animate-bounce"
        aria-label="scroll down"
      >
        <ChevronDown size={24} />
      </button>
    </section>
  )
}

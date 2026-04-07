'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import AITranslatedText from './AITranslatedText'
import { Users, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface Stats {
  totalStudents: number
  totalStories: number
  emotionData: Record<string, number>
  testimonials: Array<{ quote: string; author: string }>
}

const EMOTION_COLORS: Record<string, string> = {
  sadness: '#6366f1', // Indigo
  anger: '#ef4444',   // Red
  responsibility: '#64748b', // Slate
  hope: '#10b981',    // Emerald
}

const DUMMY_STATS: Stats = {
  totalStudents: 24,
  totalStories: 47,
  emotionData: {
    sadness: 35,
    anger: 15,
    responsibility: 20,
    hope: 30
  },
  testimonials: []
}

export default function Impact() {
  const { t } = useI18n()
  const [stats, setStats] = useState<Stats | null>(null)
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  // 데이터가 없거나 모든 값이 0이면 더미 데이터 사용
  const hasData = stats && Object.values(stats.emotionData).some(v => v > 0)
  const currentStats = hasData ? stats : DUMMY_STATS

  const emotionChartData = Object.entries(t.ailab.emotions).map(([key, label]) => ({
    name: label,
    value: currentStats!.emotionData[key] || 0,
    fill: EMOTION_COLORS[key as keyof typeof EMOTION_COLORS] ?? '#94a3b8',
  }))

  const testimonials = currentStats!.testimonials
  const prev = () => setTestimonialIdx((i) => (i - 1 + testimonials.length) % testimonials.length)
  const next = () => setTestimonialIdx((i) => (i + 1) % testimonials.length)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data)
      })
  }, [])

  return (
    <section id="impact" className="py-24 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-16 text-center">{t.impact.title}</h2>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-16">
          <div className="bg-slate-800 rounded-2xl p-8 text-center border-none shadow-none">
            <BookOpen className="mx-auto mb-3 text-amber-400" size={28} />
            <p className="text-4xl font-bold mb-1">{currentStats!.totalStories}</p>
            <p className="text-slate-400 text-sm">{t.impact.totalStories}</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-8 text-center border-none shadow-none">
            <Users className="mx-auto mb-3 text-emerald-400" size={28} />
            <p className="text-4xl font-bold mb-1">{currentStats!.totalStudents}</p>
            <p className="text-slate-400 text-sm">{t.impact.totalStudents}</p>
          </div>
        </div>

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-8 text-center">{t.impact.voices}</h3>
            <div className="relative max-w-2xl mx-auto">
              <div className="bg-slate-800 rounded-2xl p-10 text-center min-h-[160px] flex flex-col items-center justify-center">
                <AITranslatedText 
                  text={testimonials[testimonialIdx].quote} 
                  className="text-xl text-slate-200 leading-relaxed mb-6 italic" 
                />
                <p className="text-slate-400 text-sm font-medium">
                  — {testimonials[testimonialIdx].author}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={prev}
                  className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialIdx(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === testimonialIdx ? 'bg-white' : 'bg-slate-600'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={next}
                  className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Shield, Mic, FileText, ExternalLink, Hash } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import AITranslatedText from './AITranslatedText'
import {
  BarChart, Bar, XAxis, YAxis, Cell,
  ResponsiveContainer, Tooltip,
} from 'recharts'

interface Story {
  id: string
  cid: string
  ipfsUrl: string
  emotions: Record<string, number>
  keywords: string[]
  inputType: 'voice' | 'text'
  preview: string
  createdAt: string
}

const EMOTION_COLORS: Record<string, string> = {
  sadness: '#6366f1', // Indigo
  anger: '#ef4444',   // Red
  responsibility: '#64748b', // Slate
  hope: '#10b981',    // Emerald
}

const DUMMY_STORIES: Story[] = [
  {
    id: 'd1', cid: 'dummy1', ipfsUrl: '#',
    emotions: { sadness: 40, anger: 20, responsibility: 10, hope: 30 },
    keywords: ['그리움', '가족', '고향'], inputType: 'text',
    preview: '어린 시절 보았던 고향의 밤하늘이 가끔 그리워집니다...',
    createdAt: new Date().toISOString()
  },
  {
    id: 'd2', cid: 'dummy2', ipfsUrl: '#',
    emotions: { sadness: 10, anger: 10, responsibility: 20, hope: 60 },
    keywords: ['새출발', '희망', '도전'], inputType: 'voice',
    preview: '새로운 곳에서의 시작이 두렵기도 하지만 설레는 마음이 더 큽니다.',
    createdAt: new Date().toISOString()
  }
]

function EmotionMini({ emotions }: { emotions: Record<string, number> }) {
  const { t } = useI18n()
  const top = Object.entries(emotions).sort(([, a], [, b]) => b - a).slice(0, 3)
  return (
    <div className="flex gap-1 flex-wrap">
      {top.map(([emotion, val]) => (
        <span key={emotion} className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter"
          style={{
            backgroundColor: (EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS] ?? '#94a3b8') + '20',
            color: EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS] ?? '#94a3b8',
          }}
        >
          {(t.ailab.emotions as any)[emotion] || emotion} {val}%
        </span>
      ))}
    </div>
  )
}

function AggregateEmotionChart({ stories, label }: { stories: Story[]; label: string }) {
  const aggregate: Record<string, number> = {}
  const source = stories.length > 0 ? stories : DUMMY_STORIES
  for (const s of source)
    for (const [e, v] of Object.entries(s.emotions))
      aggregate[e] = (aggregate[e] ?? 0) + v

  const { t } = useI18n()
  const data = Object.entries(aggregate).map(([key, sum]) => ({
    name: (t.ailab.emotions as any)[key] || key,
    value: Math.round(sum / source.length),
    fill: EMOTION_COLORS[key as keyof typeof EMOTION_COLORS] ?? '#94a3b8',
  }))

  return (
    <div className="bg-slate-800 rounded-2xl p-6">
      <p className="text-sm font-semibold text-slate-300 mb-4 text-center">{label}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={32}>
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }}
            formatter={(v) => [`${v}%`, '']}
          />
          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function KeywordCloud({ stories, label, emptyLabel }: { stories: Story[]; label: string; emptyLabel: string }) {
  const freq: Record<string, number> = {}
  const source = stories.length > 0 ? stories : DUMMY_STORIES
  for (const s of source)
    for (const kw of s.keywords)
      freq[kw] = (freq[kw] ?? 0) + 1

  const sorted = Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 20)
  const max = sorted[0]?.[1] ?? 1

  return (
    <div className="bg-slate-800 rounded-2xl p-6">
      <p className="text-sm font-semibold text-slate-300 mb-4">{label}</p>
      <div className="flex flex-wrap gap-2">
        {sorted.map(([kw, count]) => (
          <AITranslatedText
            key={kw}
            text={kw}
            as="span"
            className="px-3 py-1 rounded-full text-slate-200"
            style={{
              fontSize: `${0.7 + (count / max) * 0.6}rem`,
              backgroundColor: `rgba(99,102,241,${0.2 + (count / max) * 0.5})`,
            } as any}
          />
        ))}
        {sorted.length === 0 && <p className="text-slate-500 text-sm">{emptyLabel}</p>}
      </div>
    </div>
  )
}

export default function StoryArchive() {
  const { t } = useI18n()
  const a = t.archive
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stories')
      .then((r) => r.json())
      .then(({ stories }) => { setStories(stories ?? []); setLoading(false) })
  }, [])

  return (
    <section id="archive" className="py-24 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-emerald-400 mb-3">
            <Shield size={18} />
            <span className="text-xs font-semibold tracking-widest uppercase">{a.badge}</span>
          </div>
          <h2 className="text-3xl font-bold">{a.title}</h2>
          <p className="text-slate-400 text-sm mt-2">{a.desc}</p>
          {stories.length > 0 && (
            <p className="text-slate-500 text-xs mt-1">{stories.length}{a.count}</p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">{t.magazine.loading}</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-3xl border border-slate-700/50">
            <p className="text-slate-500">{t.magazine.noIssue}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div key={story.id} className="bg-slate-800 rounded-3xl p-7 space-y-4 border border-slate-700/30 shadow-none hover:bg-slate-800/80 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    story.inputType === 'voice' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {story.inputType === 'voice' ? a.voice : a.text}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <AITranslatedText text={story.preview} className="text-slate-300 text-sm leading-relaxed" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

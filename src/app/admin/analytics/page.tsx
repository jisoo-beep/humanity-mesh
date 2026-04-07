'use client'

import { useEffect, useState } from 'react'
import { Eye, FileText, TrendingUp, BarChart2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import AITranslatedText from '@/components/AITranslatedText'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from 'recharts'

interface Analytics {
  totalViews: number
  totalArticles: number
  popularArticles: Array<{ id: string; title: string; authorName: string; type: string; views: number; issueNumber: number | null }>
  viewsByDate: Array<{ date: string; views: number }>
  userActivity: Array<{ date: string; visitors: number }>
  emotionStats?: Record<string, number>
}

const EMOTION_COLORS: Record<string, string> = {
  sadness: '#6366f1',
  anger: '#ef4444',
  responsibility: '#64748b',
  hope: '#10b981',
}

export default function AnalyticsPage() {
  const { t } = useI18n()
  const [data, setData] = useState<Analytics | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data)
      })
  }, [])

  if (!data) return <p className="text-slate-400">{t.adminAnalytics.loading}</p>

  const statCards = [
    { label: t.adminAnalytics.totalViews, value: data.totalViews, icon: Eye, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: t.adminAnalytics.totalArticles, value: data.totalArticles, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: t.adminAnalytics.popularViews, value: data.popularArticles[0]?.views ?? 0, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">{t.adminAnalytics.title}</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className={color} size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-8">
          <BarChart2 className="text-indigo-600" size={20} />
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{t.adminAnalytics.emotionTitle}</h2>
        </div>
        
        {data.emotionStats ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={Object.entries(t.ailab.emotions).map(([key, label]) => ({
                name: label,
                value: data.emotionStats![key] || 0,
                fill: EMOTION_COLORS[key] ?? '#94a3b8'
              }))} 
              barSize={60}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {Object.entries(t.ailab.emotions).map((entry, index) => (
                  <Cell key={index} fill={EMOTION_COLORS[entry[0]]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center py-10 text-slate-400">{t.adminAnalytics.noEmotionData}</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Views by date */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-5">{t.adminAnalytics.viewsTrend}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.viewsByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(val) => (t.weekdays as Record<string, string>)[val] || val} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={(val) => (t.weekdays as Record<string, string>)[val] || val} contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-5">{t.adminAnalytics.activityTrend}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.userActivity} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(val) => (t.weekdays as Record<string, string>)[val] || val} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={(val) => (t.weekdays as Record<string, string>)[val] || val} contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="visitors" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular articles */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-slate-700 mb-5">{t.adminAnalytics.popularList}</h2>
        <div className="space-y-3">
          {data.popularArticles.map((article, i) => (
            <div key={article.id} className="flex items-center gap-4">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate"><AITranslatedText text={article.title} as="span" /></p>
                <p className="text-xs text-slate-400">
                  {article.issueNumber != null && <span className="mr-1">Vol.{article.issueNumber} ·</span>}
                  <AITranslatedText text={article.authorName} as="span" />
                </p>
              </div>
              <div className="flex items-center gap-1 text-slate-500 flex-shrink-0">
                <Eye size={13} />
                <span className="text-sm font-medium">{article.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

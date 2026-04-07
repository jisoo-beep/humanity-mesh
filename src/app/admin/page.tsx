'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import AITranslatedText from '@/components/AITranslatedText'
import { FileText, BookOpen, Eye, TrendingUp, ArrowRight, Activity, Users } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface AdminStats {
  totalIssues: number
  publishedIssues: number
  totalArticles: number
  totalViews: number
  uniqueVisitors: number
  viewsByDate: Array<{ date: string; views: number }>
  popularArticles: Array<{ id: string; title: string; authorName: string; type: string; views: number; issueNumber: number | null }>
  userActivity: Array<{ date: string; visitors: number }>
}

export default function AdminDashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-slate-400">{t.adminDashboard.loading}</div>
  }

  if (!stats) return null

  const cards = [
    { label: t.adminDashboard.totalIssues, value: stats.totalIssues, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: t.adminDashboard.published, value: stats.publishedIssues, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: t.adminDashboard.totalArticles, value: stats.totalArticles, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: t.adminDashboard.totalViews, value: stats.totalViews, icon: Eye, color: 'text-rose-500', bg: 'bg-rose-50' },
  ]

  return (
    <div className="max-w-6xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.adminDashboard.overviewTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.adminDashboard.overviewDesc}</p>
        </div>
        <div className="text-sm text-slate-400 font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          {t.adminDashboard.lastUpdated} {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Grid for counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className={color} size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{value.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Weekly Activity Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-700">{t.adminDashboard.recentActivity}</h2>
            </div>
            <Link href="/admin/analytics" className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
              {t.adminDashboard.detailAnalysis} <ArrowRight size={12} />
            </Link>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.userActivity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => (t.weekdays as Record<string, string>)[val] || val} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(val) => (t.weekdays as Record<string, string>)[val] || val} cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Bar dataKey="visitors" radius={[6, 6, 0, 0]}>
                  {stats.userActivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === stats.userActivity.length - 1 ? '#6366f1' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Articles Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-amber-500" />
            <h2 className="font-semibold text-slate-700">{t.adminDashboard.popularArticles}</h2>
          </div>
          <div className="space-y-4">
            {stats.popularArticles.slice(0, 4).map((art, i) => (
              <div key={art.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate"><AITranslatedText text={art.title} as="span" /></p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {art.issueNumber != null && <span className="mr-1">Vol.{art.issueNumber} ·</span>}
                    <AITranslatedText text={art.authorName} as="span" />
                  </p>
                </div>
                <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Eye size={12} /> {art.views}
                </div>
              </div>
            ))}
          </div>
          <Link 
            href="/admin/analytics" 
            className="mt-6 block w-full py-2.5 rounded-xl border border-slate-100 text-center text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {t.adminDashboard.viewAll}
          </Link>
        </div>
      </div>

      {/* Shortcuts */}
      <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <ArrowRight size={18} className="text-slate-400" />
        {t.adminDashboard.quickActions}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin/content', label: t.adminDashboard.qaContentLabel, desc: t.adminDashboard.qaContentDesc, color: 'bg-indigo-600' },
          { href: '/admin/analytics', label: t.adminDashboard.qaAnalyticsLabel, desc: t.adminDashboard.qaAnalyticsDesc, color: 'bg-slate-800' },
          { href: '/', label: t.adminDashboard.qaWebLabel, desc: t.adminDashboard.qaWebDesc, color: 'bg-white border border-slate-200 text-slate-800' },
        ].map(({ href, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className={`${color} ${color.includes('white') ? 'text-slate-800' : 'text-white'} group rounded-2xl p-5 shadow-sm hover:-translate-y-1 transition-all duration-200`}
          >
            <p className="font-bold text-sm mb-1">{label}</p>
            <p className={`text-[10px] ${color.includes('white') ? 'text-slate-400' : 'text-slate-300'} mb-4 capitalize`}>{desc}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              {t.adminDashboard.go} <ArrowRight size={10} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { 
  Sparkles, 
  Loader2, 
  Edit3, 
  ShieldCheck, 
  Zap, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightCircle,
  BarChart3,
  Copy,
  Check
} from 'lucide-react'

interface Results {
  score: number
  breakdown: {
    grammar: number
    vocabulary: number
    coherence: number
    fluency: number
  }
  naturalness: string
  issues: { text: string; reason: string }[]
  correction: string
}

export default function AILab() {
  const { lang, t } = useI18n()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const analyze = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const res = await fetch('/api/ai/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(t.ailab.error)
        return
      }

      setResults(json.data)
    } catch {
      setError(t.ailab.error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500'
    if (score >= 70) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-50'
    if (score >= 70) return 'bg-amber-50'
    return 'bg-rose-50'
  }

  return (
    <section id="ailab" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-600 mb-3 bg-indigo-50 px-3 py-1 rounded-full">
            <Sparkles size={16} />
            <span className="text-xs font-bold tracking-wide uppercase">AI Writing Assistant</span>
          </div>
          <h2 className="text-4xl font-bold text-slate-800 tracking-tight mb-4">{t.ailab.title}</h2>
          <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
            {t.ailab.description}
          </p>
        </div>

        {/* Onboarding Guide */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
          {[
            { step: '01', icon: Edit3, label: t.ailab.step1, color: 'text-blue-500' },
            { step: '02', icon: Zap, label: t.ailab.step2, color: 'text-amber-500' },
            { step: '03', icon: ShieldCheck, label: t.ailab.step3, color: 'text-emerald-500' },
          ].map((item, i) => (
            <div key={i} className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100 group hover:border-indigo-100 transition-colors text-center">
              <span className="absolute top-4 left-4 text-[40px] font-black text-slate-200 leading-none group-hover:text-indigo-50 transition-colors">
                {item.step}
              </span>
              <div className={`relative z-10 w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4 ${item.color}`}>
                <item.icon size={22} />
              </div>
              <p className="relative z-10 text-sm font-medium text-slate-600 leading-snug">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Privacy Notice */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-700">
            <div className="bg-white p-1.5 rounded-lg text-indigo-600 shadow-sm shrink-0">
              <Shield size={16} />
            </div>
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              {t.ailab.privacyNotice}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.ailab.placeholder}
              rows={5}
              className="w-full rounded-2xl border-none p-6 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-0 resize-none text-lg leading-relaxed"
            />

            <button
              onClick={analyze}
              disabled={loading || !text.trim()}
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t.ailab.analyzing}
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  {t.ailab.analyze}
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-6 text-center text-red-500 text-sm font-medium">{error}</p>
        )}

        {results && (
          <div className="mt-16 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Score & Breakdown Row */}
            <div className="grid md:grid-cols-5 gap-6">
              {/* Main Score Card */}
              <div className={`md:col-span-2 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 ${getScoreBg(results.score)}`}>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">{t.ailab.coach.score}</h3>
                <div className="relative mb-6">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white" />
                    <circle 
                      cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" 
                      strokeDasharray={364.4} 
                      strokeDashoffset={364.4 - (364.4 * results.score) / 100}
                      className={`${getScoreColor(results.score)} transition-all duration-1000 ease-out`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-black ${getScoreColor(results.score)}`}>{results.score}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Points</span>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-white/50 shadow-sm">
                  <span className={`text-xs font-bold ${getScoreColor(results.score)}`}>{results.naturalness}</span>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="md:col-span-3 bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={18} className="text-indigo-500" />
                  <h4 className="text-sm font-bold text-slate-800">Detail Analysis</h4>
                </div>
                <div className="space-y-5">
                  {[
                    { label: t.ailab.coach.grammar, value: results.breakdown.grammar, max: 30 },
                    { label: t.ailab.coach.vocabulary, value: results.breakdown.vocabulary, max: 25 },
                    { label: t.ailab.coach.coherence, value: results.breakdown.coherence, max: 25 },
                    { label: t.ailab.coach.fluency, value: results.breakdown.fluency, max: 20 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1.5 px-0.5">
                        <span className="text-slate-500 font-medium">{item.label}</span>
                        <span className="text-slate-700 font-bold">{item.value} / {item.max}</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${(item.value / item.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Issues Section */}
            {results.issues.length > 0 && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <AlertCircle size={18} className="text-rose-500" />
                  <h3 className="text-lg font-bold text-slate-800">{t.ailab.coach.issuesTitle}</h3>
                </div>
                <div className="grid gap-4">
                  {results.issues.map((issue, i) => (
                    <div key={i} className="flex gap-4 p-5 rounded-2xl bg-rose-50/30 border border-rose-100/50">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 text-xs font-bold">
                        {i+1}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-rose-600 line-through decoration-1 opacity-70">"{issue.text}"</p>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{issue.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correction (After) Section */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm border border-indigo-50">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{t.ailab.coach.correctionTitle}</h3>
                </div>
              </div>
              
              <div className="relative mb-6">
                <p className="text-2xl font-medium leading-relaxed relative z-10 text-indigo-950">
                  {results.correction}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-indigo-200/50 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Clicking 'Analysis' again will offer new perspectives.</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(results.correction).then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }).catch(() => {
                      // Fallback just in case document focus stops clipboard write
                      prompt("Please copy manually:", results.correction)
                    })
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 ${
                    copied 
                      ? 'bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600'
                      : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </section>
  )
}

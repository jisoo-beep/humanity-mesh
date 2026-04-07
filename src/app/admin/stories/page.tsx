'use client'

import { useEffect, useState } from 'react'
import { Shield, Eye, Lock, Unlock, Loader2, Calendar, ExternalLink, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { Story } from '@/lib/db'

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : ''
}

export default function AdminStoriesPage() {
  const { t } = useI18n()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [decryptingId, setDecryptingId] = useState<string | null>(null)
  const [selectedStory, setSelectedStory] = useState<{ id: string; text: string } | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'voice' | 'text'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const loadStories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stories', {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const json = await res.json()
      if (json.success) {
        setStories(json.data.stories)
      } else {
        throw new Error(json.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStories()
  }, [])

  const decrypt = async (id: string) => {
    setDecryptingId(id)
    try {
      const res = await fetch(`/api/admin/stories/${id}/decrypt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const json = await res.json()
      if (json.success) {
        setSelectedStory({ id, text: json.data.text })
      } else {
        alert(t.adminStories.decryptFailed + json.error)
      }
    } catch (err: any) {
      alert(t.adminStories.errorPrompt + err.message)
    } finally {
      setDecryptingId(null)
    }
  }

  const filteredStories = stories.filter(s => {
    const matchesFilter = filter === 'all' || s.inputType === filter
    const matchesSearch = s.preview.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-sm font-medium">{t.adminStories.loading}</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 text-indigo-600 mb-2 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">
            <Shield size={14} />
            Secure Archive
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{t.adminStories.title}</h1>
          <p className="text-slate-500 mt-2">
            {t.adminStories.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            {(['all', 'voice', 'text'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f === 'all' ? t.adminStories.filterAll : f === 'voice' ? t.adminStories.filterVoice : t.adminStories.filterText}
              </button>
            ))}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text"
              placeholder={t.adminStories.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 shadow-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm mb-8 flex items-center gap-3">
          <Lock size={18} />
          {error}
        </div>
      )}

      {filteredStories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <p className="text-slate-400">{t.adminStories.noStories}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <div key={story.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(story.createdAt).toLocaleDateString()}
                </div>
                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                  story.inputType === 'voice' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {story.inputType}
                </div>
              </div>

              <div className="mb-6 h-[72px]">
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {story.preview}
                </p>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100/60">
                {Object.entries(story.emotions).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-slate-500 uppercase tracking-widest">
                        {(t.ailab.emotions as any)[key] || key}
                      </span>
                      <span className="text-slate-700">{val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          key === 'sadness' ? 'bg-indigo-400' :
                          key === 'anger' ? 'bg-rose-400' :
                          key === 'responsibility' ? 'bg-amber-400' :
                          'bg-emerald-400'
                        }`} 
                        style={{ width: `${Math.min(100, Math.max(0, val))}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => decrypt(story.id)}
                  disabled={decryptingId === story.id}
                  className="w-full py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {decryptingId === story.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {t.adminStories.decrypting}
                    </>
                  ) : (
                    <>
                      <Unlock size={14} />
                      {t.adminStories.decryptBtn}
                    </>
                  )}
                </button>
                <a
                  href={story.ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl border border-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                >
                  <ExternalLink size={14} />
                  {t.adminStories.ipfsBtn}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decryption Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Unlock size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t.adminStories.modalTitle}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[500px] overflow-y-auto">
              <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedStory.text}
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-xs">
                <Shield size={16} />
                <p>{t.adminStories.modalWarning}</p>
              </div>
            </div>

            <div className="p-8 pt-0">
              <button
                onClick={() => setSelectedStory(null)}
                className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
              >
                {t.adminStories.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

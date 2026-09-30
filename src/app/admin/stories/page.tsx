'use client'

import { useEffect, useState } from 'react'
import { Shield, Lock, Unlock, Loader2, Calendar, ExternalLink, X, FileText, BadgeCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { ArticleType, IssueWithArticles, Story } from '@/lib/db'

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : ''
}

const ARTICLE_TYPES: ArticleType[] = ['story', 'interview', 'review']

interface ArticleDraft {
  issueId: string
  type: ArticleType
  title: string
  content: string
}

export default function AdminStoriesPage() {
  const { t } = useI18n()
  const s = t.adminStories
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [decryptingId, setDecryptingId] = useState<string | null>(null)
  const [selectedStory, setSelectedStory] = useState<{ story: Story; text: string } | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'voice' | 'text' | 'consented'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [issues, setIssues] = useState<IssueWithArticles[]>([])
  const [draft, setDraft] = useState<ArticleDraft | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/stories', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStories(json.data.stories)
        else setError(json.error)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const decrypt = async (story: Story) => {
    setDecryptingId(story.id)
    try {
      const res = await fetch(`/api/admin/stories/${story.id}/decrypt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const json = await res.json()
      if (json.success) {
        setSelectedStory({ story, text: json.data.text })
      } else {
        alert(s.decryptFailed + json.error)
      }
    } catch (err) {
      alert(s.errorPrompt + (err instanceof Error ? err.message : String(err)))
    } finally {
      setDecryptingId(null)
    }
  }

  const closeModal = () => {
    setSelectedStory(null)
    setDraft(null)
  }

  const startArticleDraft = async () => {
    if (!selectedStory) return
    const res = await fetch('/api/admin/issues', { headers: { Authorization: `Bearer ${getToken()}` } })
    const json = await res.json()
    const loadedIssues: IssueWithArticles[] = json.success ? json.data.issues : []
    setIssues(loadedIssues)
    setDraft({ issueId: loadedIssues[0]?.id ?? '', type: 'story', title: '', content: selectedStory.text })
  }

  const saveArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStory || !draft) return
    const issue = issues.find((i) => i.id === draft.issueId)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...draft,
          authorName: selectedStory.story.penName ?? s.anonymous,
          displayOrder: (issue?.articles.length ?? 0) + 1,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      alert(s.articleSaved)
      closeModal()
    } catch (err) {
      alert(s.articleSaveFailed + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  const term = searchTerm.toLowerCase()
  const filteredStories = stories.filter((story) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'consented' ? story.publishConsent : story.inputType === filter)
    const matchesSearch =
      !term ||
      story.keywords.some((k) => k.toLowerCase().includes(term)) ||
      (story.penName ?? '').toLowerCase().includes(term) ||
      story.id.toLowerCase().includes(term)
    return matchesFilter && matchesSearch
  })

  const filterLabel = { all: s.filterAll, voice: s.filterVoice, text: s.filterText, consented: s.filterConsented }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-sm font-medium">{s.loading}</p>
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
          <h1 className="text-3xl font-bold text-slate-800">{s.title}</h1>
          <p className="text-slate-500 mt-2">{s.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            {(['all', 'voice', 'text', 'consented'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {filterLabel[f]}
              </button>
            ))}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input
              type="text"
              placeholder={s.searchPlaceholder}
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
          <p className="text-slate-400">{s.noStories}</p>
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

              <div className="mb-6 min-h-[72px] space-y-3">
                {story.publishConsent && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold">
                    <BadgeCheck size={13} />
                    {s.consentBadge} · {story.penName ?? s.anonymous}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {story.keywords.map((keyword) => (
                    <span key={keyword} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100/60">
                {Object.entries(story.emotions).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-slate-500 uppercase tracking-widest">
                        {(t.ailab.emotions as Record<string, string>)[key] || key}
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
                  onClick={() => decrypt(story)}
                  disabled={decryptingId === story.id}
                  className="w-full py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {decryptingId === story.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {s.decrypting}
                    </>
                  ) : (
                    <>
                      <Unlock size={14} />
                      {s.decryptBtn}
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
                  {s.ipfsBtn}
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
                  {draft ? <FileText size={20} /> : <Unlock size={20} />}
                </div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {draft ? s.toArticleTitle : s.modalTitle}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {draft ? (
              <form onSubmit={saveArticle} className="p-8 max-h-[560px] overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{s.selectIssue}</label>
                    <select
                      required
                      value={draft.issueId}
                      onChange={(e) => setDraft({ ...draft, issueId: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    >
                      {issues.map((issue) => (
                        <option key={issue.id} value={issue.id}>
                          Vol. {issue.issueNumber} {issue.title}{issue.isPublished ? '' : ` (${t.adminContent.draft})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{s.articleType}</label>
                    <select
                      value={draft.type}
                      onChange={(e) => setDraft({ ...draft, type: e.target.value as ArticleType })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    >
                      {ARTICLE_TYPES.map((type) => (
                        <option key={type} value={type}>{(t.adminContent.types as Record<string, string>)[type]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{s.articleTitle}</label>
                  <input
                    required
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{s.articleAuthor}</label>
                  <p className="px-3 py-2 text-sm bg-slate-50 rounded-xl text-slate-700">
                    {selectedStory.story.penName ?? s.anonymous}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{s.articleBody}</label>
                  <textarea
                    required
                    rows={10}
                    value={draft.content}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving || !draft.issueId}
                    className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {s.saveArticle}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    className="px-6 py-3 rounded-2xl border border-slate-200 text-sm text-slate-600 hover:border-slate-400"
                  >
                    {t.adminContent.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="p-8 max-h-[500px] overflow-y-auto">
                  <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedStory.text}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-xs">
                    <Shield size={16} />
                    <p>{s.modalWarning}</p>
                  </div>
                </div>

                <div className="p-8 pt-0 flex gap-3">
                  {selectedStory.story.publishConsent && (
                    <button
                      onClick={startArticleDraft}
                      className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText size={16} />
                      {s.toArticleBtn}
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                  >
                    {s.close}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import AITranslatedText from './AITranslatedText'
import { ChevronDown, ChevronUp, BookOpen, MessageCircle, Star } from 'lucide-react'
import type { Issue, IssueWithArticles, Article } from '@/lib/db'
import { motion, AnimatePresence } from 'framer-motion'

const typeIcon = { interview: MessageCircle, story: BookOpen, review: Star }
const typeBadgeColor = {
  interview: 'bg-blue-100 text-blue-700',
  story: 'bg-emerald-100 text-emerald-700',
  review: 'bg-amber-100 text-amber-700',
}

function ArticleItem({ article, typeLabel }: { article: Article; typeLabel: string }) {
  const [open, setOpen] = useState(false)
  const [viewed, setViewed] = useState(false)
  const Icon = typeIcon[article.type]

  const handleToggle = () => {
    if (!open && !viewed) {
      fetch(`/api/articles/${article.id}/view`, { method: 'PATCH' })
      setViewed(true)
    }
    setOpen((v) => !v)
  }

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-2xl bg-white/80 backdrop-blur border border-slate-100/60 shadow-sm hover:shadow-lg transition-all overflow-hidden"
    >
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleToggle}
        className="w-full flex items-center gap-4 p-6 text-left"
      >
        {/* badge */}
        <div className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${typeBadgeColor[article.type]}`}>
          <Icon size={12} />
          {typeLabel}
        </div>

        {/* title */}
        <div className="flex-1 min-w-0">
          <AITranslatedText
            text={article.title}
            className="font-semibold text-slate-800 text-[15px] leading-snug group-hover:text-slate-900 transition-colors"
          />
          <p className="text-xs text-slate-400 mt-1">{article.authorName}</p>
        </div>

        {/* arrow */}
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-slate-100/70">
              <AITranslatedText
                text={article.content}
                className="prose prose-sm max-w-none text-slate-600 whitespace-pre-line leading-relaxed"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Magazine() {
  const { t } = useI18n()
  const [latestIssue, setLatestIssue] = useState<IssueWithArticles | null>(null)
  const [allIssues, setAllIssues] = useState<Issue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<IssueWithArticles | null>(null)
  const [tocOpen, setTocOpen] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/issues/latest').then((r) => r.json()),
      fetch('/api/issues').then((r) => r.json()),
    ]).then(([latestRes, allRes]) => {
      if (latestRes.success) {
        setLatestIssue(latestRes.data)
        setSelectedIssue(latestRes.data)
      }
      if (allRes.success) {
        setAllIssues(allRes.data.issues ?? [])
      }
      setLoading(false)
    })
  }, [])

  const selectIssue = async (id: string) => {
    if (id === selectedIssue?.id) return
    const res = await fetch(`/api/issues/${id}`)
    const json = await res.json()
    if (json.success) {
      setSelectedIssue(json.data)
    }
  }

  const displayIssue = selectedIssue ?? latestIssue
  const typeLabel = (type: Article['type']) =>
    type === 'interview' ? t.magazine.interview
      : type === 'story' ? t.magazine.story
        : t.magazine.review

  return (
    <section id="magazine" className="py-28 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-4 text-center">{t.magazine.title}</h2>

        {loading ? (
          <p className="text-center text-slate-400 py-20">{t.magazine.loading}</p>
        ) : !displayIssue ? (
          <p className="text-center text-slate-400 py-20">{t.magazine.noIssue}</p>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Issue header */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/90 backdrop-blur rounded-3xl p-10 mb-8 shadow-md border border-slate-100"
            >
              <p className="text-xs font-semibold tracking-[0.2em] text-indigo-500 uppercase mb-3">
                {t.magazine.vol} {displayIssue.issueNumber}
              </p>
              <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-3">
                <AITranslatedText text={displayIssue.title} />
              </h3>
              <AITranslatedText text={displayIssue.theme} className="text-slate-500 text-base mb-6" />
              {displayIssue.publishedAt && (
                <p className="text-xs text-slate-400">
                  {new Date(displayIssue.publishedAt).toLocaleDateString(
                    'ko-KR',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </p>
              )}
            </motion.div>

            {/* Editor note */}
            <div className="bg-white/80 backdrop-blur rounded-2xl mb-6 shadow-sm border border-slate-100 overflow-hidden">
              <button
                onClick={() => setEditorOpen((v) => !v)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/60 transition"
              >
                <span className="font-semibold text-slate-700">{t.magazine.editorNote}</span>
                {editorOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              {editorOpen && (
                <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                  <AITranslatedText
                    text={displayIssue.editorNote}
                    className="text-slate-600 leading-relaxed whitespace-pre-line text-sm"
                  />
                </div>
              )}
            </div>

            {/* Table of contents */}
            <div className="bg-white/80 backdrop-blur rounded-2xl mb-6 shadow-sm border border-slate-100 overflow-hidden">
              <button
                onClick={() => setTocOpen((v) => !v)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/60 transition"
              >
                <span className="font-semibold text-slate-700">{t.magazine.toc}</span>
                {tocOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              {tocOpen && (
                <ul className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-3">
                  {[...displayIssue.articles]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((a) => (
                      <li key={a.id} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeColor[a.type]}`}>
                          {typeLabel(a.type)}
                        </span>
                        <AITranslatedText text={a.title} as="span" />
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Articles - Featured Concept */}
            <motion.div 
              className="mb-10"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08 } }
              }}
            >
              {(() => {
                const sorted = [...displayIssue.articles].sort((a, b) => a.displayOrder - b.displayOrder)
                if (sorted.length === 0) return null
                const [featured, ...rest] = sorted
                return (
                  <>
                    <ArticleItem article={featured} typeLabel={typeLabel(featured.type)} />
                    {rest.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {rest.map((article) => (
                          <ArticleItem key={article.id} article={article} typeLabel={typeLabel(article.type)} />
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
            </motion.div>

            {/* Past issues */}
            {allIssues.length > 1 && (
              <div className="relative mt-8">
                <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-3">
                  {t.magazine.pastIssues}
                </p>
                <div className="relative inline-block w-full sm:w-auto">
                  <button 
                    onClick={() => setArchiveOpen((prev) => !prev)}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl border border-slate-200 bg-white/90 backdrop-blur hover:border-slate-300 hover:shadow-md transition-all font-medium text-sm text-slate-700 w-full sm:w-80"
                  >
                    <span className="truncate text-left flex-1">
                      {t.magazine.vol} {displayIssue.issueNumber} · <AITranslatedText text={displayIssue.title} as="span" />
                    </span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${archiveOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {archiveOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 bottom-full mb-2 w-full origin-bottom sm:w-80 bg-white/95 backdrop-blur border border-slate-100 rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
                      >
                        <div className="max-h-64 overflow-y-auto overscroll-contain divide-y divide-slate-50">
                          {allIssues.map((issue) => (
                            <button
                              key={issue.id}
                              onClick={() => { selectIssue(issue.id); setArchiveOpen(false) }}
                              className={`w-full text-left px-5 py-3.5 text-sm transition-colors hover:bg-slate-50 ${displayIssue.id === issue.id ? 'bg-indigo-50/50 text-indigo-700 font-semibold' : 'text-slate-700'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`text-xs tracking-wider rounded-md px-1.5 py-0.5 ${displayIssue.id === issue.id ? 'bg-indigo-100/50' : 'bg-slate-100 text-slate-500'}`}>Vol. {issue.issueNumber}</span>
                                <span className="truncate flex-1">
                                  <AITranslatedText text={issue.title} as="span" />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

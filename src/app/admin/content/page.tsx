'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, Send } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import AITranslatedText from '@/components/AITranslatedText'
import type { Issue, Article, ArticleType, IssueWithArticles } from '@/lib/db'

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : ''
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}

const ARTICLE_TYPES: { value: ArticleType; label: string }[] = [
  { value: 'interview', label: '인터뷰' },
  { value: 'story', label: '스토리' },
  { value: 'review', label: '서평' },
]

interface ArticleForm {
  type: ArticleType
  title: string
  content: string
  authorName: string
  displayOrder: string
}

const emptyArticleForm: ArticleForm = {
  type: 'story',
  title: '',
  content: '',
  authorName: '',
  displayOrder: '',
}

export default function ContentPage() {
  const { t } = useI18n()
  const [issues, setIssues] = useState<IssueWithArticles[]>([])
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [articleForm, setArticleForm] = useState<ArticleForm>(emptyArticleForm)
  const [addingArticleToIssue, setAddingArticleToIssue] = useState<string | null>(null)
  const [newIssueForm, setNewIssueForm] = useState({
    issueNumber: '',
    title: '',
    theme: '',
    editorNote: '',
  })
  const [showNewIssueForm, setShowNewIssueForm] = useState(false)
  const [msg, setMsg] = useState('')

  const loadIssues = async () => {
    const res = await fetch('/api/admin/issues', { headers: { Authorization: `Bearer ${getToken()}` } })
    const json = await res.json()
    if (json.success) {
      setIssues(json.data.issues ?? [])
    }
  }

  useEffect(() => { loadIssues() }, [])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const createIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/issues', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...newIssueForm, issueNumber: Number(newIssueForm.issueNumber) }),
    })
    const json = await res.json()
    if (res.ok && json.success) {
      setNewIssueForm({ issueNumber: '', title: '', theme: '', editorNote: '' })
      setShowNewIssueForm(false)
      loadIssues()
      flash(t.adminContent.alerts.issueCreated)
    }
  }

  const publishIssue = async (id: string) => {
    if (!confirm(t.adminContent.alerts.confirmPublish)) return
    const res = await fetch(`/api/admin/issues/${id}/publish`, {
      method: 'POST',
      headers: authHeaders(),
    })
    const json = await res.json()
    if (res.ok && json.success) { loadIssues(); flash(t.adminContent.alerts.publishedSuccess) }
  }

  const saveArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    let res: Response
    if (editingArticle) {
      res = await fetch(`/api/admin/articles/${editingArticle.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...articleForm, displayOrder: Number(articleForm.displayOrder) }),
      })
    } else if (addingArticleToIssue) {
      res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          issueId: addingArticleToIssue,
          ...articleForm,
          displayOrder: Number(articleForm.displayOrder),
        }),
      })
    } else { return }

    const json = await res.json()
    if (json.success) {
      flash(editingArticle ? t.adminContent.alerts.articleUpdated : t.adminContent.alerts.articleAdded)
      setArticleForm(emptyArticleForm)
      setEditingArticle(null)
      setAddingArticleToIssue(null)
      loadIssues()
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm(t.adminContent.alerts.confirmDelete)) return
    const res = await fetch(`/api/admin/articles/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${getToken()}` } 
    })
    const json = await res.json()
    if (json.success) {
      loadIssues()
      flash(t.adminContent.alerts.deletedSuccess)
    }
  }

  const startEdit = (article: Article) => {
    setEditingArticle(article)
    setAddingArticleToIssue(null)
    setArticleForm({
      type: article.type,
      title: article.title,
      content: article.content,
      authorName: article.authorName,
      displayOrder: String(article.displayOrder),
    })
  }

  const startAdd = (issueId: string) => {
    setAddingArticleToIssue(issueId)
    setEditingArticle(null)
    setArticleForm(emptyArticleForm)
  }

  const cancelForm = () => {
    setEditingArticle(null)
    setAddingArticleToIssue(null)
    setArticleForm(emptyArticleForm)
  }

  const typeLabel = (type: string) => (t.adminContent.types as Record<string, string>)[type] ?? ARTICLE_TYPES.find((tt) => tt.value === type)?.label ?? type

  const totalPages = Math.max(1, Math.ceil(issues.length / itemsPerPage))
  const currentIssues = issues.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{t.adminContent.title}</h1>
        <button
          onClick={() => setShowNewIssueForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors"
        >
          <Plus size={16} />
          {t.adminContent.newIssueBtn}
        </button>
      </div>

      {msg && (
        <div className="mb-6 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">{msg}</div>
      )}

      {/* New issue form */}
      {showNewIssueForm && (
        <form onSubmit={createIssue} className="bg-white rounded-2xl p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-700">{t.adminContent.newIssueFormTitle}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.adminContent.issueNum}</label>
              <input type="number" min="1" required value={newIssueForm.issueNumber}
                onChange={(e) => setNewIssueForm((p) => ({ ...p, issueNumber: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.adminContent.itemTitle}</label>
              <input required value={newIssueForm.title}
                onChange={(e) => setNewIssueForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t.adminContent.theme}</label>
            <input required value={newIssueForm.theme}
              onChange={(e) => setNewIssueForm((p) => ({ ...p, theme: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t.adminContent.editorNote}</label>
            <textarea rows={3} value={newIssueForm.editorNote}
              onChange={(e) => setNewIssueForm((p) => ({ ...p, editorNote: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm hover:bg-slate-700">{t.adminContent.create}</button>
            <button type="button" onClick={() => setShowNewIssueForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-slate-400">{t.adminContent.cancel}</button>
          </div>
        </form>
      )}

      {/* Article form (add / edit) */}
      {(addingArticleToIssue || editingArticle) && (
        <form onSubmit={saveArticle} className="bg-white rounded-2xl p-6 mb-6 shadow-sm space-y-4 border-2 border-indigo-100">
          <h2 className="font-semibold text-slate-700">
            {editingArticle ? t.adminContent.editArticle : t.adminContent.addArticle}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.adminContent.typeInfo}</label>
              <select value={articleForm.type}
                onChange={(e) => setArticleForm((p) => ({ ...p, type: e.target.value as ArticleType }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                {ARTICLE_TYPES.map((tt) => <option key={tt.value} value={tt.value}>{(t.adminContent.types as Record<string, string>)[tt.value]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.adminContent.displayOrder}</label>
              <input type="number" min="1" value={articleForm.displayOrder}
                onChange={(e) => setArticleForm((p) => ({ ...p, displayOrder: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t.adminContent.itemTitle}</label>
            <input required value={articleForm.title}
              onChange={(e) => setArticleForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t.adminContent.authorLabel}</label>
            <input required value={articleForm.authorName}
              onChange={(e) => setArticleForm((p) => ({ ...p, authorName: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              placeholder={t.adminContent.authorPlaceholder} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t.adminContent.contentBody}</label>
            <textarea rows={8} required value={articleForm.content}
              onChange={(e) => setArticleForm((p) => ({ ...p, content: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500">{t.adminContent.save}</button>
            <button type="button" onClick={cancelForm} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-slate-400">{t.adminContent.cancel}</button>
          </div>
        </form>
      )}

      {/* Issues list */}
      <div className="space-y-4">
        {currentIssues.map((issue) => (
          <div key={issue.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 p-5">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400">Vol. {issue.issueNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${issue.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {issue.isPublished ? t.adminContent.published : t.adminContent.draft}
                  </span>
                </div>
                <p className="font-semibold text-slate-800 mt-1"><AITranslatedText text={issue.title} as="span" /></p>
                <p className="text-sm text-slate-500"><AITranslatedText text={issue.theme} as="span" /></p>
              </div>
              <div className="flex items-center gap-2">
                {!issue.isPublished && (
                  <button
                    onClick={() => publishIssue(issue.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-500"
                  >
                    <Send size={12} />
                    {t.adminContent.publishBtn}
                  </button>
                )}
                <button
                  onClick={() => startAdd(issue.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
                >
                  <Plus size={12} />
                  {t.adminContent.articleBtn}
                </button>
                <button
                  onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  {expandedIssue === issue.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {expandedIssue === issue.id && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {issue.articles.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400">{t.adminContent.noArticles}</p>
                ) : (
                  [...issue.articles]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((article) => (
                      <div key={article.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="text-xs text-slate-400 w-4">{article.displayOrder}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                          {typeLabel(article.type)}
                        </span>
                        <span className="flex-1 text-sm text-slate-700 truncate"><AITranslatedText text={article.title} as="span" /></span>
                        <span className="text-xs text-slate-400"><AITranslatedText text={article.authorName} as="span" /></span>
                        <button onClick={() => startEdit(article)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteArticle(article.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {issues.length > itemsPerPage && (
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500">
            Total {issues.length} {t.adminContent.itemTitle || 'Issues'}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

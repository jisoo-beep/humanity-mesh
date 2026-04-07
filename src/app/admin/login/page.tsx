'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Login failed.')
      setLoading(false)
      return
    }

    localStorage.setItem('admin_token', data.token)
    window.dispatchEvent(new Event('auth-change'))
    router.replace('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-white font-semibold text-lg">StoryTech Humanity Lab</p>
          <p className="text-slate-400 text-sm mt-1">Admin Login</p>
        </div>

        <form onSubmit={login} className="bg-slate-800 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@storytech.org"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Return to Main Homepage
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

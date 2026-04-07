'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { User, Copy, LogOut, ShieldCheck, Check } from 'lucide-react'
import { copyToClipboard } from '@/lib/clipboard'

export default function Navigation() {
  const { lang, t, setLang } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isUser, setIsUser] = useState(false)
  const [myKey, setMyKey] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const checkAuth = () => {
    setIsAdmin(!!localStorage.getItem('admin_token'))
    const key = localStorage.getItem('access_key')
    setIsUser(!!key)
    setMyKey(key || '')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    checkAuth()

    // Listen for storage changes (e.g. login from modal)
    window.addEventListener('storage', checkAuth)
    
    // Custom event for same-window updates
    window.addEventListener('auth-change', checkAuth)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('auth-change', checkAuth)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('access_key')
    setIsAdmin(false)
    setIsUser(false)
    setMyKey('')
    window.location.reload() // Simple way to reset all states
  }

  const copyKey = async () => {
    if (myKey) {
      const success = await copyToClipboard(myKey)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const scrollTo = (id: string) => {
    if (window.location.pathname !== '/') {
      window.location.href = `/#${id}`
      return
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={`font-bold tracking-tighter text-lg transition-colors ${
            scrolled ? 'text-slate-900' : 'text-white'
          }`}
        >
          StoryTech
        </Link>

        <div className="flex items-center gap-6">
          <button
            onClick={() => scrollTo('mission')}
            className={`text-sm font-medium transition-colors ${
              scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.nav.mission}
          </button>
          <button
            onClick={() => scrollTo('magazine')}
            className={`text-sm font-medium transition-colors ${
              scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.nav.magazine}
          </button>
          <Link
            href="/submit"
            className={`text-sm font-bold px-4 py-2 rounded-full transition-all ${
              scrolled 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-white text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {t.nav.ailab}
          </Link>
          <button
            onClick={() => scrollTo('impact')}
            className={`text-sm font-medium transition-colors ${
              scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.nav.impact}
          </button>

          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
            >
              {t.nav.admin}
            </Link>
          )}

          {(isAdmin || isUser) && (
            <div 
              className="relative" 
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              <button
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                  scrolled 
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <User size={18} />
              </button>

              {/* Profile Dropdown menu */}
              {profileOpen && (
                <div className="absolute top-full right-0 pt-2 w-48 z-50">
                  <div className="bg-white/95 backdrop-blur border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {isAdmin && (
                      <div className="px-4 py-2 border-b border-slate-50 flex items-center gap-2 mb-1">
                        <ShieldCheck size={14} className="text-indigo-500" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin</span>
                      </div>
                    )}
                    {isUser && myKey && (
                      <button
                        onClick={copyKey}
                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors group border-b border-slate-50"
                      >
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">
                          {copied 
                            ? (lang === 'ko' ? '복사 완료!' : 'Copied!')
                            : (lang === 'ko' ? '활성 키 복사' : 'Copy Access Key')}
                        </span>
                        {copied 
                          ? <Check size={14} className="text-emerald-500" />
                          : <Copy size={14} className="text-slate-400 group-hover:text-indigo-500" />
                        }
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-red-50/50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-slate-700 group-hover:text-red-600">
                        {lang === 'ko' ? '로그아웃' : 'Logout'}
                      </span>
                      <LogOut size={14} className="text-slate-400 group-hover:text-red-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language Toggle Swtich (Premium UI) */}
          <div className="relative flex items-center bg-slate-100/50 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm">
            <div 
              className={`absolute h-7 w-10 bg-white rounded-full shadow-sm transition-all duration-300 ease-out ${
                lang === 'ko' ? 'translate-x-0' : 'translate-x-10'
              }`}
            />
            <button
              onClick={() => setLang('ko')}
              className={`relative z-10 w-10 h-7 text-[10px] font-bold transition-colors duration-300 ${
                lang === 'ko' ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              KO
            </button>
            <button
              onClick={() => setLang('en')}
              className={`relative z-10 w-10 h-7 text-[10px] font-bold transition-colors duration-300 ${
                lang === 'en' ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

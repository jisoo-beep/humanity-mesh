'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { 
  LayoutDashboard as DashIcon, 
  FileText as FileIcon, 
  BarChart2 as ChartIcon, 
  LogOut as LogoutIcon, 
  ChevronRight as RightIcon, 
  Home as HomeIcon, 
  Shield as StoriesIcon,
  Users as UsersIcon 
} from 'lucide-react'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, lang, setLang } = useI18n()
  const [ready, setReady] = useState(false)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    
    if (!token && !isLoginPage) {
      router.replace('/admin/login')
    } else {
      setReady(true)
    }
  }, [router, isLoginPage])

  const logout = () => {
    localStorage.removeItem('admin_token')
    window.dispatchEvent(new CustomEvent('auth-change'))
    router.replace('/admin/login')
  }

  if (!ready && !isLoginPage) return null

  // 로그인 페이지일 경우 사이드바 없이 내용만 렌더링
  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <p className="text-white font-semibold text-sm">StoryTech</p>
          <p className="text-slate-500 text-xs mt-0.5">{t.adminShell.title}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/admin', label: t.adminShell.dashboard, icon: DashIcon },
            { href: '/admin/content', label: t.adminShell.content, icon: FileIcon },
            { href: '/admin/stories', label: t.adminShell.stories, icon: StoriesIcon },
            { href: '/admin/users', label: t.adminShell.users, icon: UsersIcon },
            { href: '/admin/analytics', label: t.adminShell.analytics, icon: ChartIcon },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === href ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
              <RightIcon size={14} className="ml-auto opacity-40" />
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-4">
          <div className="relative flex items-center bg-slate-800 p-1 rounded-full border border-slate-700">
            <div 
              className={`absolute h-7 w-[46%] bg-slate-700 rounded-full shadow-sm transition-all duration-300 ease-out ${
                lang === 'ko' ? 'translate-x-0' : 'translate-x-full ml-1'
              }`}
            />
            <button
              onClick={() => setLang('ko')}
              className={`relative z-10 flex-1 h-7 text-[10px] font-bold transition-colors duration-300 ${
                lang === 'ko' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              KO
            </button>
            <button
              onClick={() => setLang('en')}
              className={`relative z-10 flex-1 h-7 text-[10px] font-bold transition-colors duration-300 ${
                lang === 'en' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              EN
            </button>
          </div>

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <HomeIcon size={16} />
            {t.adminShell.backToHome}
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogoutIcon size={16} />
            {t.adminShell.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  )
}

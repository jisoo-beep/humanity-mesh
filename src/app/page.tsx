'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Mission from '@/components/Mission'
import Magazine from '@/components/Magazine'
import Impact from '@/components/Impact'
import Footer from '@/components/Footer'
import PaymentModal from '@/components/PaymentModal'
import LoginModal from '@/components/LoginModal'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { PenTool, LogIn } from 'lucide-react'

export default function Home() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const [showPayment, setShowPayment] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const hasUserKey = !!localStorage.getItem('access_key')
        const hasAdminToken = !!localStorage.getItem('admin_token')
        setIsLoggedIn(hasUserKey || hasAdminToken)
      }
    }
    
    checkAuth()
    
    window.addEventListener('storage', checkAuth)
    window.addEventListener('auth-change', checkAuth)

    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('auth-change', checkAuth)
    }
  }, [])

  const handleLabClick = () => {
    const existingKey = typeof window !== 'undefined' ? localStorage.getItem('access_key') : null
    if (existingKey) {
      router.push('/submit')
    } else {
      setShowPayment(true)
    }
  }

  return (
    <>
      <Navigation />
      <main>
        <Hero />

        {/* CTA to Writing Lab */}
        <section className="py-32 px-6 bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-30 pointer-events-none">
            <div className="w-[800px] h-[800px] bg-gradient-to-tr from-indigo-100/50 to-violet-200/50 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="bg-white border-2 border-indigo-50 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] rounded-[3rem] p-12 md:p-24 text-center overflow-hidden group relative">

              <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/0 to-indigo-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <h2 className="relative z-10 text-4xl md:text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 leading-[1.15]">
                {(t as any).lab.subtitle}
              </h2>

              <p className="relative z-10 text-slate-600 font-medium text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                {t.about.mission}
              </p>

              {/* 버튼 그룹 */}
              <div className="relative z-20 flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* 이용권 구매 / 서비스 시작 버튼 */}
                <button
                  id="writing-lab-cta"
                  onClick={handleLabClick}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 hover:scale-[1.02] hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] active:scale-95 transition-all duration-300"
                >
                  <PenTool size={22} />
                  {t.nav.ailab} {lang === 'ko' ? '시작하기' : 'Start'}
                </button>

                {/* 로그인 버튼 (이미 로그인된 상태면 표시하지 않음) */}
                {!isLoggedIn && (
                  <button
                    id="login-with-key-btn"
                    onClick={() => setShowLogin(true)}
                    className="inline-flex items-center gap-2 px-7 py-5 border-2 border-slate-200 text-slate-600 rounded-full font-bold text-base hover:border-slate-400 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all duration-200"
                  >
                    <LogIn size={18} />
                    {lang === 'ko' ? '키로 로그인' : 'Login with Key'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <Magazine />
        <Impact />
        <Mission />
      </main>
      <Footer />

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false)
            router.push('/submit')
          }}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false)
            router.push('/submit')
          }}
        />
      )}
    </>
  )
}

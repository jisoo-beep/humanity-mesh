'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AILab from '@/components/AILab'
import StorySubmit from '@/components/StorySubmit'
import PaymentModal from '@/components/PaymentModal'
import LoginModal from '@/components/LoginModal'
import { Cpu, Send, ArrowLeft, Sparkles, ShieldCheck, Key, LogIn, Check, Copy, Eye, EyeOff } from 'lucide-react'
import { copyToClipboard } from '@/lib/clipboard'
import { motion, AnimatePresence } from 'framer-motion'

export default function SubmitPage() {
  const { t, lang } = useI18n()
  const [mode, setMode] = useState<'coach' | 'submit' | null>(null)
  const [hasKey, setHasKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [myKey, setMyKey] = useState('')
  const [keyCopied, setKeyCopied] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const key = localStorage.getItem('access_key')
    if (key) {
      setHasKey(true)
      setMyKey(key)
    } else {
      setShowPayment(true)
    }
    setReady(true)
  }, [])

  const copyMyKey = async () => {
    const success = await copyToClipboard(myKey)
    if (success) {
      setKeyCopied(true)
      setTimeout(() => setKeyCopied(false), 2000)
    }
  }

  if (!ready) return null


  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navigation />

      <main className="flex-1 flex flex-col items-center justify-center py-20 px-6">
        {!hasKey ? (
          /* 키 없을 때 — 결제 유도 화면 */
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Key size={36} className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3">
              {lang === 'ko' ? '이용권이 필요합니다' : 'Access Key Required'}
            </h1>
            <p className="text-slate-400 mb-8 leading-relaxed">
              {lang === 'ko'
                ? '이 서비스를 이용하려면 이용권이 필요합니다.'
                : 'You need an access pass to use this service.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowPayment(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-colors"
              >
                {lang === 'ko' ? '이용권 구매하기' : 'Get Access Pass'}
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-700 text-slate-300 rounded-2xl font-bold hover:border-slate-500 hover:text-white transition-colors"
              >
                <LogIn size={17} />
                {lang === 'ko' ? '키로 로그인' : 'Login with Key'}
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!mode ? (
              <motion.div
                key="bridge"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl w-full text-center"
              >
                <div className="mb-12">
                  <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 mb-6 tracking-tight">
                    {t.lab.title}
                  </h1>
                  <p className="text-xl text-slate-400 font-medium mb-6">
                    {t.lab.subtitle}
                  </p>

                  {/* 내 접근 키 칩 — 클릭해서 복사 */}
                  {myKey && (
                    <div className="flex flex-col items-center gap-4 mt-8">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {lang === 'ko' ? '나의 현재 활성 키' : 'Your Active Access Key'}
                      </p>
                      <button
                        onClick={copyMyKey}
                        className={`group relative flex items-center justify-between gap-6 px-8 py-5 rounded-[2rem] font-mono text-2xl font-black transition-all duration-300 border-2 shadow-2xl ${keyCopied
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 scale-105 shadow-emerald-900/20'
                          : 'bg-slate-900 text-white border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 hover:scale-[1.02] shadow-indigo-900/20'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="tracking-[0.2em]">{showKey ? myKey : `${myKey.substring(0, 3)}••••••`}</span>
                          <div
                            onClick={(e) => { e.stopPropagation(); setShowKey(!showKey); }}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            title={showKey ? '숨기기' : '키 보기'}
                          >
                            {showKey ? <EyeOff size={24} /> : <Eye size={24} />}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${keyCopied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
                          }`}>
                          {keyCopied ? '✓' : '📋'}
                          {keyCopied ? (lang === 'ko' ? '복사됨' : 'Copied') : (lang === 'ko' ? '복사하기' : 'Copy')}
                        </div>

                        {/* 강조 효과 (글로우) */}
                        <div className="absolute inset-0 rounded-[2rem] bg-indigo-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </button>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-2">
                        <Sparkles size={14} className="text-indigo-400" />
                        {lang === 'ko' ? '이 키를 반드시 따로 안전하게 보관하세요!' : 'Make sure to save this key in a safe place!'}
                      </p>
                    </div>
                  )}
                </div>


                <div className="grid md:grid-cols-2 gap-8">
                  {/* Option: AI Coach */}
                  <button
                    onClick={() => setMode('coach')}
                    className="group relative bg-slate-900/50 border border-slate-800 p-10 rounded-[32px] text-left hover:border-indigo-500/50 hover:bg-slate-900 transition-all duration-500 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles size={120} className="text-indigo-500" />
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-8 group-hover:scale-110 transition-transform duration-500">
                      <Cpu size={28} />
                    </div>

                    <h3 className="text-2xl font-bold mb-4 group-hover:text-indigo-400 transition-colors">
                      {t.lab.optionCoachTitle}
                    </h3>
                    <p className="text-slate-400 leading-relaxed mb-6">
                      {t.lab.optionCoachDesc}
                    </p>

                    <div className="flex items-center gap-2 text-sm font-bold text-indigo-500">
                      Get Started
                      <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
                    </div>
                  </button>

                  {/* Option: Direct Submit */}
                  <button
                    onClick={() => setMode('submit')}
                    className="group relative bg-slate-900/50 border border-slate-800 p-10 rounded-[32px] text-left hover:border-emerald-500/50 hover:bg-slate-900 transition-all duration-500 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ShieldCheck size={120} className="text-emerald-500" />
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 group-hover:scale-110 transition-transform duration-500">
                      <Send size={28} />
                    </div>

                    <h3 className="text-2xl font-bold mb-4 group-hover:text-emerald-400 transition-colors">
                      {t.lab.optionDirectTitle}
                    </h3>
                    <p className="text-slate-400 leading-relaxed mb-6">
                      {t.lab.optionDirectDesc}
                    </p>

                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-500">
                      Share Now
                      <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-6xl mx-auto"
              >
                <button
                  onClick={() => setMode(null)}
                  className="mb-10 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold group"
                >
                  <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center group-hover:border-slate-500 transition-colors">
                    <ArrowLeft size={16} />
                  </div>
                  {t.lab.backToHome}
                </button>

                <div className="bg-slate-900/50 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl">
                  {mode === 'coach' ? <AILab /> : <StorySubmit />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <Footer />

      {showPayment && (
        <PaymentModal
          onClose={() => {
            setShowPayment(false)
            if (!localStorage.getItem('access_key')) {
              window.location.href = '/'
            }
          }}
          onSuccess={() => {
            setShowPayment(false)
            setHasKey(true)
          }}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => {
            setShowLogin(false)
            if (!localStorage.getItem('access_key')) {
              window.location.href = '/'
            }
          }}
          onSuccess={() => {
            setShowLogin(false)
            setHasKey(true)
          }}
        />
      )}
    </div>
  )
}


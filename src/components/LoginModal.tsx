'use client'

import { useState } from 'react'
import { X, Key, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface LoginModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { lang } = useI18n()
  const [keyInput, setKeyInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const trimmed = keyInput.trim().toUpperCase()
    if (!trimmed) {
      setError(lang === 'ko' ? '접근 키를 입력해주세요.' : 'Please enter your access key.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/payment?key=${encodeURIComponent(trimmed)}`)
      const json = await res.json()

      if (json.valid) {
        localStorage.setItem('access_key', trimmed)
        window.dispatchEvent(new Event('auth-change'))
        onSuccess()
      } else {
        setError(
          lang === 'ko'
            ? '유효하지 않은 키입니다. 다시 확인해주세요.'
            : 'Invalid key. Please check and try again.'
        )
      }
    } catch {
      setError(lang === 'ko' ? '오류가 발생했습니다. 다시 시도해주세요.' : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-8">
          {/* 아이콘 + 제목 */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Key size={26} className="text-slate-700" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {lang === 'ko' ? '키로 로그인' : 'Login with Key'}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {lang === 'ko'
                ? '발급받은 접근 키를 입력하세요.'
                : 'Enter your access key to continue.'}
            </p>
          </div>

          {/* 키 입력 */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {lang === 'ko' ? '접근 키' : 'Access Key'}
            </label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value)
                setError('')
              }}
              onKeyDown={handleKeyDown}
              placeholder="ST-XXXXXX"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-base font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-300 placeholder:tracking-normal uppercase"
              maxLength={9}
              autoFocus
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm mb-5">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            onClick={handleLogin}
            disabled={loading || !keyInput.trim()}
            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                {lang === 'ko' ? '로그인' : 'Login'}
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-400 mt-4">
            {lang === 'ko'
              ? '키를 분실하셨나요? 새 이용권을 구매하시면 새 키가 발급됩니다.'
              : "Lost your key? Purchase a new access pass to get a new key."}
          </p>
        </div>
      </div>
    </div>
  )
}

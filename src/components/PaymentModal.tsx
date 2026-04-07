'use client'

import { useState } from 'react'
import { X, CreditCard, User, ChevronRight, Copy, Check, Lock, Sparkles, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface PaymentModalProps {
  onClose: () => void
  onSuccess: (key: string) => void
}

type Step = 'form' | 'processing' | 'done'

const GENDER_OPTIONS = [
  { value: 'male', labelKo: '남성', labelEn: 'Male' },
  { value: 'female', labelKo: '여성', labelEn: 'Female' },
  { value: 'other', labelKo: '기타/비공개', labelEn: 'Other / Prefer not to say' },
]

export default function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const { lang } = useI18n()
  const [step, setStep] = useState<Step>('form')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [key, setKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setError('')
    if (!age || Number(age) < 1 || Number(age) > 120) {
      setError(lang === 'ko' ? '올바른 연령을 입력해주세요.' : 'Please enter a valid age.')
      return
    }
    if (!gender) {
      setError(lang === 'ko' ? '성별을 선택해주세요.' : 'Please select your gender.')
      return
    }

    setStep('processing')

    // 결제 처리 (모의) — 실제 서비스에서는 PG사 연동 후 이 API 호출
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: Number(age), gender }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) throw new Error('failed')

      // 키를 localStorage에 저장
      localStorage.setItem('access_key', json.key)
      window.dispatchEvent(new Event('auth-change'))
      setKey(json.key)

      // 짧은 딜레이로 "처리 중" 느낌 부여
      setTimeout(() => {
        setStep('done')
      }, 1200)
    } catch {
      setStep('form')
      setError(lang === 'ko' ? '처리 중 오류가 발생했습니다. 다시 시도해주세요.' : 'An error occurred. Please try again.')
    }
  }

  const copyKey = () => {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* 헤더 그라디언트 */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

        {/* 닫기 버튼 */}
        {step !== 'processing' && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        <div className="p-8">
          {/* ── STEP 1: 폼 ── */}
          {step === 'form' && (
            <>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  <CreditCard size={13} />
                  {lang === 'ko' ? '이용권 구매' : 'Get Access'}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {lang === 'ko' ? '스토리텍 이용권' : 'StoryTech Access Pass'}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {lang === 'ko'
                    ? '기본 정보를 입력하면 랜덤 접근 키를 발급해드립니다. 키는 안전하게 보관해주세요.'
                    : 'Enter your basic info to receive a unique access key. Keep it safe.'}
                </p>
              </div>

              {/* 요금 표시 */}
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                    {lang === 'ko' ? '이용권' : 'Access Pass'}
                  </p>
                  <p className="text-slate-700 font-semibold text-sm">
                    {lang === 'ko' ? '글쓰기 연구소 + 익명 스토리 제출' : 'Writing Lab + Anonymous Submission'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-800">₩0</p>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'ko' ? '현재 무료 체험' : 'Free trial'}
                  </p>
                </div>
              </div>

              {/* 연령 */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  <User size={11} className="inline mr-1" />
                  {lang === 'ko' ? '연령' : 'Age'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={lang === 'ko' ? '예: 17' : 'e.g. 17'}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-300"
                />
              </div>

              {/* 성별 */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {lang === 'ko' ? '성별' : 'Gender'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        gender === opt.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {lang === 'ko' ? opt.labelKo : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs mb-4 text-center font-medium">{error}</p>
              )}

              {/* 결제 버튼 */}
              <button
                onClick={handlePay}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                <CreditCard size={18} />
                {lang === 'ko' ? '결제하고 키 발급받기' : 'Pay & Get My Key'}
                <ChevronRight size={18} />
              </button>

              <p className="text-center text-[11px] text-slate-400 mt-3">
                <Lock size={10} className="inline mr-1" />
                {lang === 'ko'
                  ? '입력 정보는 통계 목적으로만 사용되며 개인 식별에 쓰이지 않습니다.'
                  : 'Your info is used for statistics only and is not personally identifiable.'}
              </p>
            </>
          )}

          {/* ── STEP 2: 처리 중 ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">
                  {lang === 'ko' ? '결제 처리 중...' : 'Processing payment...'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {lang === 'ko' ? '잠시만 기다려주세요.' : 'Please wait a moment.'}
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 3: 키 발급 완료 ── */}
          {step === 'done' && (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="text-emerald-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {lang === 'ko' ? '키 발급 완료!' : 'Key Issued!'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {lang === 'ko'
                    ? '아래 접근 키를 안전하게 보관하세요. 서비스 이용 시 필요합니다.'
                    : 'Keep this access key safe. You\'ll need it to use the service.'}
                </p>
              </div>

              {/* 키 표시 */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                  {lang === 'ko' ? '나의 접근 키' : 'My Access Key'}
                </p>

                {/* 키 + 복사 버튼 통합 — 클릭하면 복사 */}
                <button
                  onClick={copyKey}
                  title={lang === 'ko' ? '클릭해서 복사' : 'Click to copy'}
                  className={`w-full rounded-2xl p-6 text-center transition-all duration-200 border-2 border-dashed cursor-pointer group ${
                    copied
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                  }`}
                >
                  <p className={`text-4xl font-black tracking-[0.2em] font-mono mb-3 transition-colors ${
                    copied ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {key}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
                    copied ? 'text-emerald-600' : 'text-slate-400 group-hover:text-indigo-500'
                  }`}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied
                      ? (lang === 'ko' ? '✓ 복사됐어요!' : '✓ Copied!')
                      : (lang === 'ko' ? '클릭해서 복사하기' : 'Click to copy')}
                  </span>
                </button>
              </div>


              <div className="flex items-start gap-3 p-5 bg-amber-50 border-2 border-amber-200 rounded-3xl mb-8 text-sm text-amber-800 shadow-sm animate-pulse">
                <Sparkles size={18} className="shrink-0 mt-0.5 text-amber-600" />
                <p className="font-medium">
                  {lang === 'ko'
                    ? '이 키는 다시 표시되지 않습니다. 반드시 메모해두거나 복사해 주세요. 키를 분실하면 새로 구매해야 합니다.'
                    : 'This key will not be shown again. Please copy or write it down. Lost keys require a new purchase.'}
                </p>
              </div>

              <button
                onClick={() => onSuccess(key)}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 hover:scale-[1.02] shadow-lg transition-all active:scale-95"
              >
                {lang === 'ko' ? '복사 완료, 서비스 시작하기 🚀' : 'Copied! Start Using Service 🚀'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useI18n } from '@/lib/i18n'

import { ShieldCheck, Lock, UserX, Cpu, ArrowRight } from 'lucide-react'

export default function Mission() {
  const { t, lang } = useI18n()

  const securitySteps = [
    { id: 'step1', icon: UserX, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'step2', icon: Lock, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'step3', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'step4', icon: Cpu, color: 'text-violet-500', bg: 'bg-violet-50' },
  ]

  return (
    <section id="mission" className="py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-16 text-center">{t.about.title}</h2>

        <div className="grid md:grid-cols-2 gap-12 mb-24">
          <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 shadow-sm space-y-8 self-start">
            <div>
              <p className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-3">
                {t.about.missionLabel}
              </p>
              <p className="text-slate-700 leading-relaxed text-lg font-medium">{t.about.mission}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-emerald-500 uppercase mb-3">
                {t.about.visionLabel}
              </p>
              <p className="text-slate-700 leading-relaxed text-base">{t.about.vision}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 shadow-sm self-start">
            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-4">
              {t.about.bgLabel}
            </p>
            <p className="text-slate-600 leading-relaxed">
              {t.about.bg}
            </p>
          </div>
        </div>

        {/* Security Logic Section */}
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 -translate-y-1/2 hidden lg:block" />
          
          <h3 className="text-2xl font-bold text-slate-800 mb-12 text-center relative z-10">
            {t.about.securityTitle}
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {securitySteps.map((step, idx) => (
              <div key={step.id} className="relative flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mb-6 shadow-sm`}>
                  <step.icon className={step.color} size={28} />
                </div>
                
                <div className="text-center">
                  <h4 className="font-bold text-slate-800 mb-2">
                    {(t as any).about.securitySteps[step.id].title}
                  </h4>
                  <p className="text-slate-500 text-sm leading-relaxed px-4">
                    {(t as any).about.securitySteps[step.id].desc}
                  </p>
                </div>

                {idx < securitySteps.length - 1 && (
                  <div className="absolute top-8 -right-4 text-slate-200 hidden lg:block">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Technical Summary / Admissions Officer WOW Factor */}
          <div className="mt-20 bg-slate-900 rounded-[2.5rem] p-10 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-indigo-400 mb-6">
                <Cpu size={24} />
                <span className="text-xs font-bold tracking-[0.2em] uppercase">Technical Specification</span>
              </div>
              
              <h4 className="text-2xl font-bold text-white mb-6">
                {lang === 'ko' ? '신뢰할 수 있는 데이터 거버넌스' : 'Trustworthy Data Governance'}
              </h4>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {lang === 'ko' 
                      ? '본 플랫폼은 탈북 청소년의 극도로 민감한 개인정보를 보호하기 위해 설계되었습니다. 저장 계층(IPFS)의 불변성과 전송 계층(AES-256)의 기밀성을 결합하고, 애플리케이션 계층에서 AI 동적 마스킹 엔진을 도입하여 관리자조차 식별 정보에 접근할 수 없도록 원천 차단합니다.'
                      : 'Our platform is designed to protect the extremely sensitive personal info of North Korean youth. By combining the immutability of the storage layer (IPFS), the confidentiality of the transmission layer (AES-256), and an AI dynamic masking engine at the application layer, we ensure that even administrators cannot access identifiable information.'}
                  </p>
                </div>
                <div className="border-l border-slate-800 pl-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-slate-300 text-xs font-medium">NLP-based PII Detection & Emotion Mapping</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-300 text-xs font-medium">Decentralized IPFS Persistence</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-slate-300 text-xs font-medium">Post-Decryption Real-time Masking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

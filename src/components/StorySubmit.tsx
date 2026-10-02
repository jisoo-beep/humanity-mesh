'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic, MicOff, Volume2, Shield, Upload, CheckCircle,
  FileText, AlertCircle, ExternalLink, RefreshCw
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'

type InputMode = 'voice' | 'text'
type PipelineStep = 'idle' | 'processing' | 'done' | 'error'

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

export default function StorySubmit() {
  const { t, lang } = useI18n()
  const s = t.submit

  const [mode, setMode] = useState<InputMode>('voice')
  const [hasRecorded, setHasRecorded] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const [transcript, setTranscript] = useState('')
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle')
  const [resultCid, setResultCid] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [error, setError] = useState('')
  const [publishConsent, setPublishConsent] = useState(false)
  const [penName, setPenName] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setSpeechSupported(false); return }

    const r = new SR()
    r.lang = lang === 'ko' ? 'ko-KR' : 'en-US'
    r.continuous = true
    r.interimResults = true

    r.onresult = (e: SpeechRecognitionEvent) => {
      let final = '', interimBuf = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interimBuf += e.results[i][0].transcript
      }
      if (final) {
        setTranscript(final)
        setHasRecorded(true)
      }
      setInterim(interimBuf)
    }
    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed') {
        setError(s.speechNotAllowed)
      } else if (e.error !== 'aborted') {
        setError(`${s.speechError}${e.error}`)
      }
      setIsRecording(false)
    }
    r.onend = () => { setIsRecording(false); setInterim('') }

    recognitionRef.current = r
    return () => recognitionRef.current?.abort()
  }, [lang])

  // Draft Auto-save
  useEffect(() => {
    const saved = localStorage.getItem('story_draft')
    if (saved && !transcript) setTranscript(saved)
  }, [])

  useEffect(() => {
    if (transcript && pipelineStep === 'idle') {
      localStorage.setItem('story_draft', transcript)
    }
  }, [transcript, pipelineStep])

  const startRecording = useCallback(async () => {
    if (!recognitionRef.current) return
    setError('')
    setTranscript('')
    setInterim('')

    try {
      // 1. 보안 연결 확인 (localhost 또는 https에서만 navigator.mediaDevices가 존재함)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg = lang === 'ko'
          ? '보안 연결(localhost 또는 HTTPS)이 필요합니다.\n주소창에 http://localhost:3000 을 직접 입력해서 접속해주세요.'
          : 'Secure context (localhost or HTTPS) required.\nPlease use http://localhost:3000 instead of IP address.';
        setError(msg)
        return
      }

      // 2. 강제로 마이크 권한 팝업 트리거 (getUserMedia 사용)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // 권한 획득 성공 시 즉시 스트림 닫기 (SpeechRecognition이 별도로 마이크를 잡아야 함)
      stream.getTracks().forEach(track => track.stop())

      // 3. 권한 획득 후 음성 인식 시작
      recognitionRef.current.start()
      setIsRecording(true)
    } catch (err: any) {
      console.error('Microphone access error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(s.speechNotAllowed)
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError(lang === 'ko' ? '연결된 마이크를 찾을 수 없습니다.' : 'No microphone found.')
      } else {
        setError(`${s.speechError}${err.message || err.name}`)
      }
      setIsRecording(false)
    }
  }, [s, lang])

  const stopRecording = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch (e) {
      console.error('Stop error:', e)
    }
    setIsRecording(false)
  }, [])

  const previewTTS = useCallback(() => {
    if (!transcript) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(transcript)
    utterance.lang = lang === 'ko' ? 'ko-KR' : 'en-US'
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [transcript, lang])

  const stopTTS = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const submit = async () => {
    const text = transcript.trim()
    if (!text || text.length < 10) return
    setError('')
    setPipelineStep('processing')
    try {
      // 익명화 → 암호화 → IPFS 업로드는 서버에서 한 번에 처리
      const submitRes = await fetch('/api/stories/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': localStorage.getItem('access_key') ?? '',
        },
        body: JSON.stringify({ text, inputType: mode, publishConsent, penName: publishConsent ? penName : '' }),
      })
      const json = await submitRes.json()
      if (!submitRes.ok) throw new Error(json.error ?? 'Upload failed')
      const { cid, ipfsUrl } = json

      setResultCid(cid)
      setResultUrl(ipfsUrl)
      setPipelineStep('done')
      localStorage.removeItem('story_draft')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error occurred')
      setPipelineStep('error')
    }
  }

  const reset = () => {
    setTranscript(''); setInterim('')
    setPipelineStep('idle'); setResultCid(''); setResultUrl(''); setError('')
    setPublishConsent(false); setPenName('')
    localStorage.removeItem('story_draft')
  }

  const handleModeSwitch = (m: InputMode) => {
    setMode(m)
  }

  const STEPS = [
    { key: 'anonymize', label: s.stepAnonymize, icon: Shield },
    { key: 'upload', label: s.stepUpload, icon: Upload },
    { key: 'done', label: s.stepDone, icon: CheckCircle },
  ] as const

  const isProcessing = pipelineStep === 'processing'
  const isDone = pipelineStep === 'done'

  return (
    <section id="submit" className="py-24 bg-white">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-emerald-600 mb-3">
            <Shield size={18} />
            <span className="text-xs font-semibold tracking-widest uppercase">{s.badge}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{s.title}</h2>
          <p className="text-emerald-600 text-sm font-bold mt-2 bg-emerald-50 py-2 px-4 rounded-xl inline-block border border-emerald-100">
            {s.desc}
          </p>
          <p className="text-slate-400 text-xs mt-3 leading-relaxed max-w-md mx-auto">{s.descDetail}</p>
        </div>

        {!isDone ? (
          <>
            {/* Mode selector */}
            <div className="flex rounded-xl border border-slate-200 p-1 mb-6">
              {(['voice', 'text'] as InputMode[]).map((m) => (
                <button key={m} onClick={() => handleModeSwitch(m)} disabled={isProcessing}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {m === 'voice' ? <Mic size={15} /> : <FileText size={15} />}
                  {m === 'voice' ? s.modeVoice : s.modeText}
                </button>
              ))}
            </div>

            {/* Voice input */}
            {mode === 'voice' && (
              <div className="mb-6">
                {!speechSupported ? (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-xl text-sm">
                    <AlertCircle size={16} />{s.unsupported}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg flex items-center gap-1">
                        <Mic size={11} /> {lang === 'ko' ? '원본 음성' : 'Original Voice'}
                      </span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-slate-100 rounded-lg">
                        🔤 {lang === 'ko' ? '텍스트 변환' : 'Transcribe'}
                      </span>
                      <span>→</span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg flex items-center gap-1">
                        <Volume2 size={11} /> {lang === 'ko' ? '합성 음성' : 'Synthetic Voice'}
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording
                            ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110 animate-pulse'
                            : 'bg-slate-800 text-white hover:bg-slate-700 hover:scale-105'
                          }`}
                      >
                        {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                      </button>
                    </div>

                    <p className="text-center text-xs text-slate-400">
                      {isRecording ? s.recordHint : s.recordStart}
                    </p>

                    {((hasRecorded && transcript) || interim || isRecording) && (
                      <div className="min-h-[100px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed">
                        {transcript}
                        {interim && <span className="text-slate-400">{interim}</span>}
                        {isRecording && !transcript && !interim && (
                          <span className="text-slate-300 animate-pulse">{s.listening}</span>
                        )}
                      </div>
                    )}

                    {(hasRecorded && transcript && !isRecording) && (
                      <button
                        onClick={isSpeaking ? stopTTS : previewTTS}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                      >
                        <Volume2 size={15} className={isSpeaking ? 'text-emerald-500 animate-pulse' : ''} />
                        {isSpeaking ? s.stopTTS : s.previewTTS}
                      </button>
                    )}

                    {/* Counters for Voice Input */}
                    {((hasRecorded && transcript) || interim) && (
                      <div className="flex justify-end gap-4 px-2 mt-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          <FileText size={12} className="text-slate-300" />
                          {s.wordCount}: <span className="text-slate-600">{(transcript.length + interim.length)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          <RefreshCw size={12} className="text-slate-300" />
                          {s.readingTime}: <span className="text-slate-600">
                            {Math.ceil((transcript.length + interim.length) / 250)} {s.minSec}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Text input */}
            {mode === 'text' && (
              <div className="relative">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={isProcessing}
                  placeholder={s.placeholder}
                  rows={8}
                  className="w-full mb-2 rounded-2xl border border-slate-200 p-5 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none text-sm leading-relaxed"
                />
                <div className="flex justify-end gap-4 px-2 mb-6">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    <FileText size={12} className="text-slate-300" />
                    {s.wordCount}: <span className="text-slate-600">{transcript.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    <RefreshCw size={12} className="text-slate-300" />
                    {s.readingTime}: <span className="text-slate-600">
                      {Math.ceil(transcript.length / 250)} {s.minSec}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Magazine publish consent */}
            <div className="mb-6 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishConsent}
                  onChange={(e) => setPublishConsent(e.target.checked)}
                  disabled={isProcessing}
                  className="mt-0.5 accent-emerald-600"
                />
                <span>
                  {s.consentLabel}
                  <span className="block text-xs text-slate-400 mt-0.5">{s.consentHint}</span>
                </span>
              </label>
              {publishConsent && (
                <div className="pl-6">
                  <label htmlFor="pen-name" className="block text-sm font-medium text-slate-700">{s.penNameLabel}</label>
                  <p className="text-xs text-slate-400 mt-0.5 mb-2">{s.penNameHint}</p>
                  <input
                    id="pen-name"
                    value={penName}
                    onChange={(e) => setPenName(e.target.value)}
                    disabled={isProcessing}
                    maxLength={30}
                    placeholder={s.penNamePlaceholder}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <p className="text-xs text-amber-600 mt-1.5">{s.penNameWarning}</p>
                </div>
              )}
            </div>

            {/* Pipeline progress */}
            {isProcessing && (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  {STEPS.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex flex-col items-center gap-1 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${key !== 'done'
                          ? 'bg-indigo-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-400'
                        }`}>
                        <Icon size={14} />
                      </div>
                      <span className={`text-xs ${key !== 'done' ? 'text-slate-700' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                <AlertCircle size={15} />{error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!transcript.trim() || transcript.trim().length < 10 || isProcessing}
              className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Shield size={16} />{s.submit}
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">{s.submitHint}</p>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{s.doneTitle}</p>
              <p className="text-sm text-slate-400 mt-1">{s.doneDesc}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.cidLabel}</p>
              <p className="font-mono text-xs text-slate-700 break-all">{resultCid}</p>
              {resultUrl && (
                <a href={resultUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 mt-2"
                >
                  {s.ipfsLink}<ExternalLink size={11} />
                </a>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { window.location.href = '/#archive' }}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                {s.viewArchive}
              </button>
              <button onClick={reset}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-400 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />{s.newStory}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

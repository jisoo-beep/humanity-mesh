'use client'

import { useState, useEffect, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { Loader2 } from 'lucide-react'

interface AITranslatedTextProps {
  text: string
  className?: string
  style?: React.CSSProperties
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'div'
  children?: React.ReactNode
}

// 간단한 인메모리 캐시
const translationCache: Record<string, string> = {}

export default function AITranslatedText({ 
  text, 
  className = '', 
  style,
  as: Component = 'p',
  children
}: AITranslatedTextProps) {
  const { lang } = useI18n()
  const [translated, setTranslated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const cacheKey = useMemo(() => `${lang}:${text}`, [lang, text])

  useEffect(() => {
    // 한국어 모드이거나 텍스트가 없을 경우 원본 출력
    if (lang === 'ko' || !text.trim()) {
      setTranslated(null)
      setLoading(false)
      return
    }

    // 캐시 확인
    if (translationCache[cacheKey]) {
      setTranslated(translationCache[cacheKey])
      setLoading(false)
      return
    }

    const translate = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLang: lang }),
        })
        const json = await res.json()
        if (json.success) {
          translationCache[cacheKey] = json.translatedText
          setTranslated(json.translatedText)
        } else {
          setTranslated(text) // 실패 시 원본
        }
      } catch (err) {
        console.error('Translation error:', err)
        setTranslated(text)
      } finally {
        setLoading(false)
      }
    }

    translate()
  }, [text, lang, cacheKey])

  if (lang === 'ko') {
    return <Component className={className} style={style}>{children}{text}</Component>
  }

  if (loading) {
    return (
      <Component className={`${className} animate-pulse flex items-center gap-2 opacity-50`} style={style}>
        {children}
        <Loader2 size={14} className="animate-spin" />
        <span>Translating...</span>
      </Component>
    )
  }

  return <Component className={className} style={style}>{children}{translated || text}</Component>
}

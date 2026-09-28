'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer id="archive" className="bg-slate-950 text-slate-400 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 md:gap-32 mb-16">
          {/* Brand */}
          <div className="md:w-1/2 lg:w-1/3">
            <p className="text-white font-semibold mb-3">StoryTech Humanity Lab</p>
            <p className="text-sm leading-relaxed text-slate-500">
              {t.footer.about}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-600">
          <Link href="/admin/login" className="hover:text-slate-500 transition-colors">
            {t.footer.rights}
          </Link>
        </div>
      </div>
    </footer>
  )
}

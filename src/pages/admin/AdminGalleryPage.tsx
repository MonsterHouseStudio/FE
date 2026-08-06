import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { galleryItems } from '@/mocks/data'
import { formatDate } from '@/lib/utils'
import { Badge, Photo } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader, DemoNotice } from './AdminLayout'

const CATEGORY_LABEL: Record<string, string> = {
  BODY_PROFILE: 'gallery.catBodyProfile',
  MOTIVATION: 'gallery.catMotivation',
  CENTER_PROMO: 'gallery.catCenter',
}

export default function AdminGalleryPage() {
  const { t } = useTranslation()
  // 기획서 §6.2 — 초상권: 게시 동의 여부를 DB 에 기록·관리
  const [items, setItems] = useState(() =>
    galleryItems('ko').map((item) => ({ ...item, consent: item.id % 5 !== 0 })),
  )

  const toggleConsent = (id: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, consent: !i.consent } : i)))

  return (
    <>
      <AdminPageHeader
        title={t('admin.gallery')}
        desc={t('gallery.consentNote')}
        action={<Button size="sm">+ {t('admin.actionAdd')}</Button>}
      />
      <DemoNotice />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="surface overflow-hidden">
            <div className="relative">
              <Photo src={item.thumbUrl} seed={item.seed} alt={item.caption} className="aspect-square w-full" />
              {!item.consent && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <span className="rounded-full border border-red-500/50 px-3 py-1 text-[11px] font-bold text-red-300">
                    {t('admin.consentHidden')}
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <Badge tone="neutral">{t(CATEGORY_LABEL[item.category])}</Badge>
              <p className="mt-2.5 line-clamp-2 text-xs leading-snug text-ink-300">
                {item.caption}
              </p>
              <p className="mt-2 text-[11px] text-ink-600">{formatDate(item.takenAt, 'ko')}</p>

              <label className="mt-4 flex cursor-pointer items-center gap-2 border-t border-ink-800 pt-3">
                <input
                  type="checkbox"
                  checked={item.consent}
                  onChange={() => toggleConsent(item.id)}
                  className="h-3.5 w-3.5 accent-brand-600"
                />
                <span className="text-[11px] text-ink-400">{t('admin.consent')}</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

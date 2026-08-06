import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from '@/hooks/useLocale'
import { useModalDismiss } from '@/hooks/useModalDismiss'
import { cn, formatDate } from '@/lib/utils'
import type { GalleryCategory, GalleryItem } from '@/types'
import { Button } from '@/components/ui/Button'
import { EmptyBlock, LoadingBlock, PageHeader, Photo, Section } from '@/components/ui/primitives'

type Filter = 'ALL' | GalleryCategory

const PAGE_SIZE = 8

const RATIO_CLASS: Record<GalleryItem['ratio'], string> = {
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  square: 'aspect-square',
}

export default function GalleryPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState<GalleryItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', locale],
    queryFn: () => api.getGallery(locale),
  })

  const filtered = useMemo(
    () => (data ?? []).filter((item) => (filter === 'ALL' ? true : item.category === filter)),
    [data, filter],
  )

  const closeLightbox = useCallback(() => setSelected(null), [])
  useModalDismiss(!!selected, closeLightbox)

  const filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: t('gallery.catAll') },
    { key: 'PHOTO', label: t('gallery.catPhoto') },
    { key: 'VIDEO', label: t('gallery.catVideo') },
  ]

  return (
    <>
      <PageHeader
        eyebrow={t('gallery.subtitle')}
        title={t('gallery.title')}
        desc={t('gallery.desc')}
      />

      <Section>
        <div className="mb-9 flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setFilter(f.key)
                  setVisible(PAGE_SIZE)
                }}
                className={cn(
                  'rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                  filter === f.key
                    ? 'border-brand-500 bg-brand-600 text-white'
                    : 'border-ink-800 text-ink-400 hover:border-ink-600 hover:text-white',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink-600">{t('gallery.consentNote')}</p>
        </div>

        {isLoading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : filtered.length === 0 ? (
          <EmptyBlock label={t('common.empty')} />
        ) : (
          <>
            <div className="columns-2 gap-3 sm:gap-4 lg:columns-4">
              {filtered.slice(0, visible).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  /* break-inside-avoid 가 없으면 아이템이 컬럼 경계에서 잘립니다 */
                  className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg text-left sm:mb-4"
                >
                  <div className="relative">
                    <Photo
                      src={item.thumbUrl}
                      seed={item.seed}
                      alt={item.caption}
                      className={cn(
                        'w-full transition-transform duration-500 group-hover:scale-105',
                        RATIO_CLASS[item.ratio],
                      )}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-[11px] leading-snug text-white">{item.caption}</p>
                      <p className="mt-1 text-[10px] text-white/50">
                        {formatDate(item.takenAt, locale)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {visible < filtered.length && (
              <div className="mt-10 flex justify-center">
                <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  {t('gallery.loadMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </Section>

      {/* 라이트박스 */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-5 animate-fade-in"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={selected.caption}
        >
          <button
            type="button"
            onClick={closeLightbox}
            aria-label={t('common.close')}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-ink-700 text-xl text-ink-300 hover:text-white"
          >
            ×
          </button>
          <figure
            className="max-h-full w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Photo
              src={selected.imageUrl}
              seed={selected.seed}
              alt={selected.caption}
              className="aspect-[4/3] w-full rounded-xl"
            />
            <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-200">{selected.caption}</p>
              <p className="text-xs text-ink-500">{formatDate(selected.takenAt, locale)}</p>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  )
}

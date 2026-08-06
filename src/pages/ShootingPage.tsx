import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { formatPrice } from '@/lib/utils'
import { formatProductPrice } from '@/lib/price'
import type { Product, ProductType } from '@/types'
import { ButtonLink } from '@/components/ui/Button'
import { Badge, LoadingBlock, PageHeader, Photo, Section } from '@/components/ui/primitives'

/** 가격표 순서 — 사진 → 영상 → 통역 */
const GROUPS: { type: ProductType; labelKey: string }[] = [
  { type: 'PHOTO', labelKey: 'shooting.catPhoto' },
  { type: 'VIDEO', labelKey: 'shooting.catVideo' },
  { type: 'INTERPRETER', labelKey: 'shooting.catInterpreter' },
]

export default function ShootingPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const lp = useLocalePath()

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', locale],
    queryFn: () => api.getProducts(locale),
  })

  const grouped = useMemo(() => {
    const list = products ?? []
    return GROUPS.map((group) => ({
      ...group,
      items: list.filter((p) => p.type === group.type),
    })).filter((group) => group.items.length > 0)
  }, [products])

  const steps = [1, 2, 3, 4].map((n) => ({
    n,
    title: t(`shooting.step${n}Title`),
    desc: t(`shooting.step${n}Desc`),
  }))

  return (
    <>
      <PageHeader
        eyebrow={t('shooting.subtitle')}
        title={t('shooting.title')}
        desc={t('shooting.desc')}
      >
        <ButtonLink to={lp('/shooting/booking')} size="lg">
          {t('nav.booking')}
        </ButtonLink>
      </PageHeader>

      {isLoading ? (
        <Section>
          <LoadingBlock label={t('common.loading')} />
        </Section>
      ) : (
        grouped.map((group, gi) => (
          <Section
            key={group.type}
            className={gi % 2 === 1 ? 'border-t border-ink-800 bg-ink-900/30' : ''}
            eyebrow={group.type}
            title={t(group.labelKey)}
          >
            <div className="space-y-5">
              {group.items.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={gi * 10 + i + 1}
                  bookHref={`${lp('/shooting/booking')}?product=${product.id}`}
                  inquiryHref={lp('/interpreter')}
                />
              ))}
            </div>
          </Section>
        ))
      )}

      {/* 진행 순서 */}
      <Section className="border-t border-ink-800" eyebrow="PROCESS" title={t('shooting.processTitle')}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.n} className="surface relative p-7">
              <span className="font-display text-4xl tracking-tightest text-brand-800">
                0{step.n}
              </span>
              <h3 className="mt-4 text-base font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 안내 */}
      <Section>
        <div className="surface border-brand-800/50 bg-brand-950/20 p-7 sm:p-10">
          <h2 className="font-display text-xl tracking-tightest text-white">
            {t('shooting.noticeTitle')}
          </h2>
          <ul className="mt-5 space-y-3">
            {[
              t('shooting.venueNotice'),
              t('shooting.notice1'),
              t('shooting.notice2'),
              t('shooting.notice3'),
            ].map((n, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-ink-300">
                <span className="mt-0.5 font-display text-xs text-brand-500">0{i + 1}</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  )
}

function ProductCard({
  product,
  index,
  bookHref,
  inquiryHref,
}: {
  product: Product
  index: number
  bookHref: string
  inquiryHref: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const options = product.options ?? []

  return (
    <article className="surface grid overflow-hidden lg:grid-cols-[minmax(0,360px)_1fr]">
      <Photo seed={product.id * 4} className="aspect-[4/3] w-full lg:aspect-auto" />

      <div className="flex flex-col p-7 sm:p-9">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-sm text-brand-500">
            {String(index).padStart(2, '0')}
          </span>
          {/* 통역은 소요시간이 없습니다(대회 일정에 맞춤) */}
          {product.bookable && product.durationMin > 0 && (
            <Badge tone="brand">
              {t('shooting.duration')} · {t('common.minutes', { count: product.durationMin })}
            </Badge>
          )}
          {!product.bookable && <Badge tone="neutral">{t('shooting.inquiryOnly')}</Badge>}
        </div>

        <h3 className="mt-4 font-display text-2xl tracking-tightest text-white sm:text-3xl">
          {product.name}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-300">{product.description}</p>

        {product.includes.length > 0 && (
          <div className="mt-6">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">
              {t('shooting.detail')}
            </h4>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {product.includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-300">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 추가 옵션 */}
        {options.length > 0 && (
          <div className="mt-6 rounded-lg border border-ink-800 bg-ink-950/40 p-5">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">
              {t('shooting.options')}
            </h4>
            <ul className="mt-3 space-y-2">
              {options.map((option) => (
                <li key={option.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-ink-300">
                    {option.name}
                    {option.maxQuantity > 1 && (
                      <span className="ml-2 text-xs text-ink-600">
                        ({t('shooting.optionEach')})
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-semibold text-brand-300">
                    + {formatPrice(option.price, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {product.note && (
          <p className="mt-4 text-xs text-ink-500">* {product.note}</p>
        )}

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-ink-800 pt-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
              {t('shooting.price')}
            </div>
            <div className="mt-1 font-display text-2xl tracking-tightest text-white">
              {formatProductPrice(product, locale, t)}
            </div>
          </div>

          {product.bookable ? (
            <ButtonLink to={bookHref}>{t('shooting.book')}</ButtonLink>
          ) : (
            // 통역은 대회 일정에 맞춰야 해서 슬롯 예약이 아니라 문의로 받습니다.
            <ButtonLink to={inquiryHref} variant="outline">
              {t('nav.interpreter')}
            </ButtonLink>
          )}
        </div>
      </div>
    </article>
  )
}

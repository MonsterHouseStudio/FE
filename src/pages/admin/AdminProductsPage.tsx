import { useTranslation } from 'react-i18next'
import { PRODUCTS } from '@/mocks/data'
import { formatPrice } from '@/lib/utils'
import { Badge, Photo } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader, DemoNotice } from './AdminLayout'

export default function AdminProductsPage() {
  const { t } = useTranslation()
  const ko = PRODUCTS.ko
  const ja = PRODUCTS.ja

  return (
    <>
      <AdminPageHeader
        title={t('admin.products')}
        action={<Button size="sm">+ {t('admin.actionAdd')}</Button>}
      />
      <DemoNotice />

      <div className="space-y-4">
        {ko.map((product) => {
          const jaVersion = ja.find((p) => p.id === product.id)
          const translated = !!jaVersion?.name

          return (
            <div key={product.id} className="surface flex flex-wrap items-center gap-5 p-5">
              <Photo seed={product.id * 4} className="h-20 w-20 shrink-0 rounded-lg" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg tracking-tightest text-white">
                    {product.name}
                  </h2>
                  <Badge tone="brand">{t('common.minutes', { count: product.durationMin })}</Badge>
                  {/* 기획서 §3.2 — 관리자 화면에 "일본어 미작성" 배지 */}
                  <Badge tone={translated ? 'success' : 'warning'}>
                    {translated ? t('admin.translated') : t('admin.jaMissing')}
                  </Badge>
                </div>
                <p className="mt-1.5 line-clamp-1 text-sm text-ink-400">{product.description}</p>
                <p className="mt-1 text-xs text-ink-600">JA: {jaVersion?.name ?? '—'}</p>
              </div>

              <div className="text-right">
                <div className="font-display text-lg tracking-tightest text-white">
                  {formatPrice(product.price, 'ko')}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline">
                    {t('admin.actionEdit')}
                  </Button>
                  <Button size="sm" variant="ghost">
                    {t('admin.actionDelete')}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { AdminProduct } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'

const TYPE_LABEL: Record<AdminProduct['type'], string> = {
  PHOTO: '사진 촬영',
  VIDEO: '영상 촬영',
  INTERPRETER: '통역',
}

const UNIT_SUFFIX: Record<AdminProduct['priceUnit'], string> = {
  PER_SESSION: '',
  PER_DAY: ' / 1일',
  PER_HOUR: ' / 1시간',
}

export default function AdminProductsPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getProducts(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const toggleActive = async (product: AdminProduct) => {
    setBusyId(product.id)
    setActionError(null)
    try {
      await adminApi.setProductActive(product.id, !product.active)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '처리에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const products = data ?? []

  return (
    <>
      <AdminPageHeader
        title={t('admin.products')}
        desc="비활성화한 상품은 고객 화면에서 사라지고 새 예약도 받지 않습니다. 기존 예약은 그대로 유지됩니다."
      />

      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300"
        >
          {actionError}
        </p>
      )}

      <AsyncBoundary
        loading={loading}
        error={error}
        empty={!loading && products.length === 0}
        emptyText="등록된 상품이 없습니다."
        onRetry={reload}
      >
        {products.length > 0 && (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className={
                  'surface flex flex-wrap items-center gap-5 p-5 ' +
                  (product.active ? '' : 'opacity-55')
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg tracking-tightest text-white">
                      {product.nameKo}
                    </h2>
                    <Badge tone="neutral">{TYPE_LABEL[product.type]}</Badge>

                    {product.bookable ? (
                      <Badge tone="brand">
                        {t('common.minutes', { count: product.durationMin })}
                      </Badge>
                    ) : (
                      /* 통역처럼 슬롯 예약을 받지 않는 상품 — 가격표에만 노출됩니다 */
                      <Badge tone="neutral">문의 접수</Badge>
                    )}

                    {/* 기획서 §3.2 — 일본어 미작성 표시 */}
                    <Badge tone={product.translated ? 'success' : 'warning'}>
                      {product.translated ? t('admin.translated') : t('admin.jaMissing')}
                    </Badge>

                    {!product.active && <Badge tone="warning">비활성</Badge>}
                  </div>

                  {product.descriptionKo && (
                    <p className="mt-1.5 line-clamp-1 text-sm text-ink-400">
                      {product.descriptionKo}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ink-600">JA: {product.nameJa || '—'}</p>

                  {product.options.length > 0 && (
                    <p className="mt-2 text-xs text-ink-500">
                      옵션{' '}
                      {product.options
                        .map((o) => `${o.name} (+${formatPrice(o.price, 'ko')})`)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-display text-lg tracking-tightest text-white">
                    {formatPrice(product.price, 'ko')}
                    <span className="ml-0.5 text-xs font-normal text-ink-500">
                      {UNIT_SUFFIX[product.priceUnit]}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === product.id}
                      onClick={() => void toggleActive(product)}
                    >
                      {product.active ? '비활성화' : '활성화'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}

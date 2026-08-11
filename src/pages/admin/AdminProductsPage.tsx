import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type {
  AdminProduct,
  PriceUnit,
  ProductOptionSavePayload,
  ProductSavePayload,
  ProductType,
} from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'
import { AdminModal, BilingualField, Field, LineListField } from './AdminModal'

const TYPE_LABEL: Record<ProductType, string> = {
  PHOTO: '사진 촬영',
  VIDEO: '영상 촬영',
  INTERPRETER: '통역',
}

const UNIT_LABEL: Record<PriceUnit, string> = {
  PER_SESSION: '1회당',
  PER_DAY: '1일당',
  PER_HOUR: '1시간당',
}

const UNIT_SUFFIX: Record<PriceUnit, string> = {
  PER_SESSION: '',
  PER_DAY: ' / 1일',
  PER_HOUR: ' / 1시간',
}

/** 새 상품의 기본값 — 사진 촬영 90분이 가장 흔한 형태입니다. */
function emptyProduct(sortOrder: number): ProductSavePayload {
  return {
    type: 'PHOTO',
    nameKo: '',
    nameJa: '',
    descriptionKo: '',
    descriptionJa: '',
    durationMin: 90,
    price: 0,
    includesKo: [],
    includesJa: [],
    sortOrder,
    priceUnit: 'PER_SESSION',
    bookable: true,
    noteKo: '',
    noteJa: '',
  }
}

/** 응답(AdminProduct) → 저장 요청(ProductSavePayload). id·options 등 서버 소유 값은 뺍니다. */
function toPayload(p: AdminProduct): ProductSavePayload {
  return {
    type: p.type,
    nameKo: p.nameKo,
    nameJa: p.nameJa ?? '',
    descriptionKo: p.descriptionKo ?? '',
    descriptionJa: p.descriptionJa ?? '',
    durationMin: p.durationMin,
    price: p.price,
    includesKo: p.includesKo,
    includesJa: p.includesJa,
    sortOrder: p.sortOrder,
    priceUnit: p.priceUnit,
    bookable: p.bookable,
    noteKo: p.noteKo ?? '',
    noteJa: p.noteJa ?? '',
  }
}

export default function AdminProductsPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getProducts(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: number | null; form: ProductSavePayload } | null>(
    null,
  )
  const [optionOf, setOptionOf] = useState<AdminProduct | null>(null)

  const products = data ?? []

  const run = async (id: number, fn: () => Promise<unknown>) => {
    setBusyId(id)
    setActionError(null)
    try {
      await fn()
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '처리에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = (p: AdminProduct) => {
    // 서버가 예약 이력이 있으면 거부합니다(PRODUCT_IN_USE). 그 메시지를 그대로 보여줍니다.
    if (!window.confirm(`"${p.nameKo}" 을(를) 삭제할까요?\n예약 이력이 있으면 삭제되지 않습니다.`))
      return
    void run(p.id, () => adminApi.deleteProduct(p.id))
  }

  return (
    <>
      <AdminPageHeader
        title={t('admin.products')}
        desc="비활성화한 상품은 고객 화면에서 사라지고 새 예약도 받지 않습니다. 기존 예약은 그대로 유지됩니다."
        action={
          <Button
            size="sm"
            onClick={() => setEditing({ id: null, form: emptyProduct(products.length) })}
          >
            + {t('admin.actionAdd')}
          </Button>
        }
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
                      <Badge tone="neutral">문의 접수</Badge>
                    )}

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

                  <p className="mt-2 text-xs text-ink-500">
                    옵션{' '}
                    {product.options.length === 0
                      ? '없음'
                      : product.options
                          .map((o) => `${o.name} (+${formatPrice(o.price, 'ko')})`)
                          .join(' · ')}
                    <button
                      type="button"
                      onClick={() => setOptionOf(product)}
                      className="ml-2 font-bold text-brand-400 hover:underline"
                    >
                      관리
                    </button>
                  </p>
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
                      onClick={() => setEditing({ id: product.id, form: toPayload(product) })}
                    >
                      {t('admin.actionEdit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === product.id}
                      onClick={() =>
                        void run(product.id, () =>
                          adminApi.setProductActive(product.id, !product.active),
                        )
                      }
                    >
                      {product.active ? '비활성화' : '활성화'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === product.id}
                      onClick={() => remove(product)}
                    >
                      {t('admin.actionDelete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncBoundary>

      {editing && (
        <ProductForm
          state={editing}
          onChange={(form) => setEditing({ ...editing, form })}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}

      {optionOf && (
        <OptionManager
          product={optionOf}
          onClose={() => setOptionOf(null)}
          onChanged={() => {
            setOptionOf(null)
            reload()
          }}
        />
      )}
    </>
  )
}

// =====================================================================

function ProductForm({
  state,
  onChange,
  onClose,
  onSaved,
}: {
  state: { id: number | null; form: ProductSavePayload }
  onChange: (form: ProductSavePayload) => void
  onClose: () => void
  onSaved: () => void
}) {
  const { id, form } = state
  const set = <K extends keyof ProductSavePayload>(k: K, v: ProductSavePayload[K]) =>
    onChange({ ...form, [k]: v })

  const submit = async () => {
    // 빈 줄은 저장할 때만 걸러냅니다 (입력 중에 지우면 커서가 튑니다).
    const payload: ProductSavePayload = {
      ...form,
      includesKo: form.includesKo.map((s) => s.trim()).filter(Boolean),
      includesJa: form.includesJa.map((s) => s.trim()).filter(Boolean),
    }
    if (id === null) await adminApi.createProduct(payload)
    else await adminApi.updateProduct(id, payload)
    onSaved()
  }

  return (
    <AdminModal
      title={id === null ? '상품 추가' : '상품 수정'}
      onClose={onClose}
      onSubmit={submit}
      wide
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="분류">
          <select
            className="field"
            value={form.type}
            onChange={(e) => set('type', e.target.value as ProductType)}
          >
            {(Object.keys(TYPE_LABEL) as ProductType[]).map((k) => (
              <option key={k} value={k}>
                {TYPE_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="가격 (원)">
          <input
            className="field"
            type="number"
            min={0}
            step={1000}
            value={form.price}
            onChange={(e) => set('price', Number(e.target.value))}
          />
        </Field>
        <Field label="가격 단위">
          <select
            className="field"
            value={form.priceUnit}
            onChange={(e) => set('priceUnit', e.target.value as PriceUnit)}
          >
            {(Object.keys(UNIT_LABEL) as PriceUnit[]).map((k) => (
              <option key={k} value={k}>
                {UNIT_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <BilingualField
        label="상품명"
        ko={form.nameKo}
        ja={form.nameJa}
        onKo={(v) => set('nameKo', v)}
        onJa={(v) => set('nameJa', v)}
      />

      <BilingualField
        label="설명"
        textarea
        ko={form.descriptionKo}
        ja={form.descriptionJa}
        onKo={(v) => set('descriptionKo', v)}
        onJa={(v) => set('descriptionJa', v)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <LineListField
          label="포함 사항 (한국어)"
          value={form.includesKo}
          onChange={(v) => set('includesKo', v)}
        />
        <LineListField
          label="포함 사항 (日本語)"
          value={form.includesJa}
          onChange={(v) => set('includesJa', v)}
          hint="비워두면 고객 화면에서 한국어가 대신 표시됩니다."
        />
      </div>

      <BilingualField
        label="비고"
        ko={form.noteKo}
        ja={form.noteJa}
        onKo={(v) => set('noteKo', v)}
        onJa={(v) => set('noteJa', v)}
        placeholder="예: * 사진촬영 별도"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="소요 시간 (분)" hint="15~600분">
          <input
            className="field"
            type="number"
            min={15}
            max={600}
            step={15}
            value={form.durationMin}
            onChange={(e) => set('durationMin', Number(e.target.value))}
          />
        </Field>
        <Field label="정렬 순서" hint="작을수록 먼저">
          <input
            className="field"
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value))}
          />
        </Field>
        <Field label="온라인 예약" hint="끄면 가격표에만 노출되고 문의로 접수합니다.">
          <label className="mt-1 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={form.bookable}
              onChange={(e) => set('bookable', e.target.checked)}
            />
            <span className="text-sm text-ink-200">슬롯 예약 받기</span>
          </label>
        </Field>
      </div>
    </AdminModal>
  )
}

// =====================================================================

const emptyOption: ProductOptionSavePayload = {
  nameKo: '',
  nameJa: '',
  price: 0,
  maxQuantity: 1,
  sortOrder: 0,
  active: true,
}

function OptionManager({
  product,
  onClose,
  onChanged,
}: {
  product: AdminProduct
  onClose: () => void
  onChanged: () => void
}) {
  const [form, setForm] = useState<ProductOptionSavePayload>({
    ...emptyOption,
    sortOrder: product.options.length,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof ProductOptionSavePayload>(
    k: K,
    v: ProductOptionSavePayload[K],
  ) => setForm({ ...form, [k]: v })

  const removeOption = async (optionId: number) => {
    if (!window.confirm('이 옵션을 삭제할까요?')) return
    setBusy(true)
    setError(null)
    try {
      await adminApi.deleteProductOption(product.id, optionId)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.')
      setBusy(false)
    }
  }

  return (
    <AdminModal
      title={`옵션 관리 — ${product.nameKo}`}
      onClose={onClose}
      submitLabel="옵션 추가"
      onSubmit={async () => {
        await adminApi.addProductOption(product.id, {
          ...form,
          nameKo: form.nameKo.trim(),
          nameJa: form.nameJa.trim(),
        })
        onChanged()
      }}
      wide
    >
      <div>
        <label className="label">현재 옵션</label>
        {product.options.length === 0 ? (
          <p className="rounded-lg border border-ink-800 px-4 py-3 text-xs text-ink-500">
            등록된 옵션이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-ink-800 rounded-lg border border-ink-800">
            {product.options.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <span className="text-sm text-white">{o.name}</span>
                  <span className="ml-2 text-xs text-ink-500">
                    +{formatPrice(o.price, 'ko')} · 최대 {o.maxQuantity}개
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removeOption(o.id)}
                  className="shrink-0 text-[11px] text-ink-600 hover:text-red-400"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      </div>

      <div className="border-t border-ink-800 pt-5">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">
          새 옵션 추가
        </p>

        <BilingualField
          label="옵션명"
          ko={form.nameKo}
          ja={form.nameJa}
          onKo={(v) => set('nameKo', v)}
          onJa={(v) => set('nameJa', v)}
          placeholder="예: 보정본 1장 추가"
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="추가 금액 (원)">
            <input
              className="field"
              type="number"
              min={0}
              step={1000}
              value={form.price}
              onChange={(e) => set('price', Number(e.target.value))}
            />
          </Field>
          <Field label="최대 수량" hint="1이면 체크박스로 표시">
            <input
              className="field"
              type="number"
              min={1}
              max={99}
              value={form.maxQuantity}
              onChange={(e) => set('maxQuantity', Number(e.target.value))}
            />
          </Field>
          <Field label="정렬 순서">
            <input
              className="field"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value))}
            />
          </Field>
        </div>
      </div>
    </AdminModal>
  )
}

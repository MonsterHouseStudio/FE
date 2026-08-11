import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { daysUntil, formatDate } from '@/lib/utils'
import type {
  AdminCompetition,
  CompetitionSavePayload,
  CompetitionTranslation,
  Country,
  ServerLocale,
} from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'
import { AdminModal, Field } from './AdminModal'

/** 한국어 번역이 없으면 아무 번역이나 씁니다 — 관리자 화면은 비어 보이는 게 최악입니다. */
function pick(row: AdminCompetition) {
  return row.translations.find((tr) => tr.locale === 'KO') ?? row.translations[0]
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function emptyCompetition(): CompetitionSavePayload {
  return {
    country: 'KR',
    startDate: today(),
    endDate: today(),
    link: '',
    published: true,
    translations: [],
  }
}

function toPayload(row: AdminCompetition): CompetitionSavePayload {
  return {
    country: row.country,
    startDate: row.startDate,
    endDate: row.endDate,
    link: row.link ?? '',
    published: row.published,
    translations: row.translations,
  }
}

export default function AdminSchedulePage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getCompetitions(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    id: number | null
    form: CompetitionSavePayload
  } | null>(null)

  const rows = [...(data ?? [])].sort((a, b) => b.startDate.localeCompare(a.startDate))

  const remove = async (row: AdminCompetition) => {
    const name = pick(row)?.name ?? '이 대회'
    if (!window.confirm(`"${name}" 일정을 삭제할까요?`)) return
    setBusyId(row.id)
    setActionError(null)
    try {
      await adminApi.deleteCompetition(row.id)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title={t('admin.schedule')}
        desc={data ? `전체 ${data.length}건` : undefined}
        action={
          <Button size="sm" onClick={() => setEditing({ id: null, form: emptyCompetition() })}>
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
        empty={!loading && rows.length === 0}
        emptyText="등록된 대회 일정이 없습니다."
        onRetry={reload}
      >
        {rows.length > 0 && (
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-ink-800 text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">{t('schedule.country')}</th>
                  <th className="px-5 py-4 font-semibold">{t('schedule.title')}</th>
                  <th className="px-5 py-4 font-semibold">{t('admin.datetime')}</th>
                  <th className="px-5 py-4 font-semibold">{t('schedule.place')}</th>
                  <th className="px-5 py-4 font-semibold">공개</th>
                  <th className="px-5 py-4 font-semibold">JA</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {rows.map((row) => {
                  const d = daysUntil(row.startDate)
                  const tr = pick(row)
                  const translated = !row.missingLocales.includes('JA')

                  return (
                    <tr key={row.id} className="transition-colors hover:bg-ink-800/40">
                      <td className="px-5 py-4">
                        <Badge tone={row.country === 'KR' ? 'brand' : 'neutral'}>
                          {row.country === 'KR' ? t('schedule.korea') : t('schedule.japan')}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{tr?.name ?? '—'}</div>
                        {tr?.host && <div className="mt-0.5 text-xs text-ink-500">{tr.host}</div>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-ink-200">
                        {formatDate(row.startDate, 'ko')}
                        <span
                          className={`ml-2 text-xs ${d < 0 ? 'text-ink-600' : 'text-brand-400'}`}
                        >
                          {d < 0
                            ? t('schedule.ended')
                            : d === 0
                              ? t('schedule.ddayToday')
                              : `D-${d}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-ink-300">{tr?.place ?? '—'}</td>
                      <td className="px-5 py-4">
                        <Badge tone={row.published ? 'success' : 'neutral'}>
                          {row.published ? '공개' : '비공개'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={translated ? 'success' : 'warning'}>
                          {translated ? t('admin.translated') : t('admin.jaMissing')}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditing({ id: row.id, form: toPayload(row) })}
                          className="text-xs font-bold text-brand-400 hover:underline"
                        >
                          {t('admin.actionEdit')}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void remove(row)}
                          className="ml-3 text-xs text-ink-600 hover:text-red-400"
                        >
                          {t('admin.actionDelete')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AsyncBoundary>

      {editing && (
        <CompetitionForm
          state={editing}
          onChange={(form) => setEditing({ ...editing, form })}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}

// =====================================================================

const BLANK: Omit<CompetitionTranslation, 'locale'> = {
  name: '',
  description: '',
  place: '',
  host: '',
}

function CompetitionForm({
  state,
  onChange,
  onClose,
  onSaved,
}: {
  state: { id: number | null; form: CompetitionSavePayload }
  onChange: (form: CompetitionSavePayload) => void
  onClose: () => void
  onSaved: () => void
}) {
  const { id, form } = state

  const set = <K extends keyof CompetitionSavePayload>(k: K, v: CompetitionSavePayload[K]) =>
    onChange({ ...form, [k]: v })

  const tr = (locale: ServerLocale): Omit<CompetitionTranslation, 'locale'> =>
    form.translations.find((x) => x.locale === locale) ?? BLANK

  const setTr = (
    locale: ServerLocale,
    field: keyof Omit<CompetitionTranslation, 'locale'>,
    value: string,
  ) => {
    const current = tr(locale)
    const next = { ...current, [field]: value }
    const rest = form.translations.filter((x) => x.locale !== locale)

    // 이름이 비면 그 언어 번역 자체를 제거합니다.
    // 서버가 name 을 @NotBlank 로 막고 있어서 빈 채로 보내면 400 입니다.
    onChange({
      ...form,
      translations: next.name.trim()
        ? [...rest, { locale, ...next } as CompetitionTranslation]
        : rest,
    })
  }

  const submit = async () => {
    if (form.translations.length === 0) {
      throw new Error('최소 한 언어의 대회명을 입력해주세요.')
    }
    if (form.endDate < form.startDate) {
      throw new Error('종료일이 시작일보다 빠릅니다.')
    }
    if (id === null) await adminApi.createCompetition(form)
    else await adminApi.updateCompetition(id, form)
    onSaved()
  }

  return (
    <AdminModal
      title={id === null ? '대회 일정 추가' : '대회 일정 수정'}
      onClose={onClose}
      onSubmit={submit}
      wide
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="개최국">
          <select
            className="field"
            value={form.country}
            onChange={(e) => set('country', e.target.value as Country)}
          >
            <option value="KR">한국</option>
            <option value="JP">일본</option>
          </select>
        </Field>
        <Field label="시작일">
          <input
            className="field"
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
        </Field>
        <Field label="종료일">
          <input
            className="field"
            type="date"
            value={form.endDate}
            onChange={(e) => set('endDate', e.target.value)}
          />
        </Field>
        <Field label="공개 여부">
          <label className="mt-1 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={form.published}
              onChange={(e) => set('published', e.target.checked)}
            />
            <span className="text-sm text-ink-200">사이트에 노출</span>
          </label>
        </Field>
      </div>

      <Field label="공식 링크" hint="대회 공지 페이지 주소 (선택)">
        <input
          className="field"
          type="url"
          placeholder="https://"
          value={form.link}
          onChange={(e) => set('link', e.target.value)}
        />
      </Field>

      {/* 대회는 언어별 독립 발행이라 번역 테이블 구조를 그대로 편집합니다 (기획서 §3.2) */}
      <div className="grid gap-5 border-t border-ink-800 pt-5 sm:grid-cols-2">
        {(['KO', 'JA'] as ServerLocale[]).map((locale) => (
          <div key={locale} className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              {locale === 'KO' ? '한국어' : '日本語'}
              {locale === 'JA' && <span className="ml-1.5 font-normal">선택</span>}
            </p>
            <Field label="대회명">
              <input
                className="field"
                value={tr(locale).name}
                placeholder={locale === 'JA' ? '비워두면 이 언어에는 노출되지 않습니다' : ''}
                onChange={(e) => setTr(locale, 'name', e.target.value)}
              />
            </Field>
            <Field label="주최">
              <input
                className="field"
                value={tr(locale).host ?? ''}
                onChange={(e) => setTr(locale, 'host', e.target.value)}
              />
            </Field>
            <Field label="장소">
              <input
                className="field"
                value={tr(locale).place ?? ''}
                onChange={(e) => setTr(locale, 'place', e.target.value)}
              />
            </Field>
            <Field label="설명">
              <textarea
                className="field"
                rows={3}
                value={tr(locale).description ?? ''}
                onChange={(e) => setTr(locale, 'description', e.target.value)}
              />
            </Field>
          </div>
        ))}
      </div>
    </AdminModal>
  )
}

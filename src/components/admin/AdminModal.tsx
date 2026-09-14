import { useCallback, useState } from 'react'
import { useModalDismiss } from '@/hooks/useModalDismiss'
import { Button } from '@/components/ui/Button'

/**
 * 관리자 편집용 공통 모달.
 *
 * 편집 화면 5개가 전부 같은 구조(제목 / 폼 / 저장·취소 / 오류)라
 * 한 곳에 모았습니다. 화면마다 따로 만들면 저장 중 이중 클릭 방지나
 * ESC 처리 같은 걸 한 곳에서 빠뜨리게 됩니다.
 */
export function AdminModal({
  title,
  onClose,
  onSubmit,
  submitLabel = '저장',
  wide = false,
  children,
}: {
  title: string
  onClose: () => void
  onSubmit: () => Promise<void>
  submitLabel?: string
  wide?: boolean
  children: React.ReactNode
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = useCallback(() => {
    if (!busy) onClose()
  }, [busy, onClose])

  useModalDismiss(true, close)

  const submit = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit()
    } catch (err) {
      // 서버 메시지를 그대로 보여줍니다.
      // "slug 는 영문 소문자, 숫자, 하이픈만" 같은 안내가 이미 서버에 있습니다.
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-5"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={
          'surface my-8 w-full p-7 ' + (wide ? 'max-w-3xl' : 'max-w-lg')
        }
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl tracking-tightest text-white">{title}</h2>

        <div className="mt-6 space-y-5">{children}</div>

        {error && (
          <p
            role="alert"
            className="mt-5 whitespace-pre-wrap rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-300"
          >
            {error}
          </p>
        )}

        <div className="mt-7 flex justify-end gap-2 border-t border-ink-800 pt-5">
          <Button size="sm" variant="ghost" onClick={close} disabled={busy}>
            취소
          </Button>
          <Button size="sm" onClick={() => void submit()} disabled={busy}>
            {busy ? '저장 중…' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** 라벨 + 입력 한 줄. 반복이 많아 묶었습니다. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-ink-500">{hint}</p>}
    </div>
  )
}

/**
 * 한국어/일본어를 나란히 입력받는 칸.
 *
 * ★ 일본어를 optional 로 두고 빈 값을 그대로 보내는 게 중요합니다.
 *   한국어를 복사해 채워두면 "번역된 것처럼" 보여서 미번역 배지가 사라지고,
 *   일본 고객에게 한국어가 그대로 나갑니다 (기획서 §3.2).
 */
export function BilingualField({
  label,
  ko,
  ja,
  onKo,
  onJa,
  textarea = false,
  placeholder,
}: {
  label: string
  ko: string
  ja: string
  onKo: (v: string) => void
  onJa: (v: string) => void
  textarea?: boolean
  placeholder?: string
}) {
  const Input = textarea ? 'textarea' : 'input'
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">{label} (한국어)</label>
        <Input
          className="field"
          rows={textarea ? 3 : undefined}
          value={ko}
          placeholder={placeholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
            onKo(e.target.value)
          }
        />
      </div>
      <div>
        <label className="label">
          {label} (日本語)
          <span className="ml-1.5 font-normal text-ink-600">선택</span>
        </label>
        <Input
          className="field"
          rows={textarea ? 3 : undefined}
          value={ja}
          placeholder="비워두면 '번역 필요'로 표시됩니다"
          onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
            onJa(e.target.value)
          }
        />
      </div>
    </div>
  )
}

/** 줄 단위로 편집하는 문자열 목록 (상품 "포함 사항" 등) */
export function LineListField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  hint?: string
}) {
  return (
    <Field label={label} hint={hint ?? '한 줄에 하나씩 입력하세요.'}>
      <textarea
        className="field"
        rows={4}
        value={value.join('\n')}
        // 입력 중 빈 줄을 지우면 커서가 튀므로, 저장 시점에만 걸러냅니다.
        onChange={(e) => onChange(e.target.value.split('\n'))}
      />
    </Field>
  )
}

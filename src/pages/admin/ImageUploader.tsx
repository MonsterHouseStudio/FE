import { useRef, useState } from 'react'
import { adminApi } from '@/lib/api'
import type { UploadedImage } from '@/types'

/**
 * 이미지 업로드 + 미리보기.
 *
 * 서버가 원본·중간·썸네일 3벌을 만들어 key 와 URL 을 함께 돌려줍니다.
 * DB 에는 URL 이 아니라 **key** 를 저장합니다 —
 * URL 을 박아두면 CDN 도메인이 바뀌는 순간 과거 데이터가 전부 깨집니다.
 */
export function ImageUploader({
  directory,
  value,
  onUploaded,
  label = '이미지',
}: {
  directory: 'gallery' | 'post' | 'product'
  /** 현재 이미지 미리보기 URL (없으면 빈 상자) */
  value?: string | null
  onUploaded: (image: UploadedImage) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return

    // 서버도 검사하지만, 10MB 파일을 올리고 나서 거절당하는 것보다
    // 고르는 즉시 알려주는 편이 낫습니다.
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('JPG, PNG 이미지만 올릴 수 있습니다.')
      return
    }

    setBusy(true)
    setError(null)
    // 업로드가 끝나기 전에도 사용자가 고른 그림이 보이도록 로컬 미리보기를 먼저 띄웁니다.
    setPreview(URL.createObjectURL(file))

    try {
      const uploaded = await adminApi.uploadImage(file, directory)
      onUploaded(uploaded)
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
      setPreview(null)
    } finally {
      setBusy(false)
      // 같은 파일을 다시 고를 수 있도록 값을 비웁니다.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const shown = preview ?? value

  return (
    <div>
      <label className="label">{label}</label>

      <div className="flex items-start gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-ink-700 bg-ink-900">
          {shown ? (
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-ink-600">
              없음
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[11px] text-white">
              업로드 중…
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            disabled={busy}
            onChange={(e) => void pick(e.target.files?.[0])}
            className="block w-full text-xs text-ink-400 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-brand-500"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
            JPG · PNG. 업로드하면 원본과 썸네일이 자동 생성됩니다.
          </p>
          {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  )
}

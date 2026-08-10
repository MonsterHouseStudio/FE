/**
 * 관리자 화면의 로딩·오류·빈 목록 표시를 한 곳에 모읍니다.
 *
 * 화면마다 따로 만들면 "오류인데 빈 목록처럼 보이는" 경우가 생깁니다.
 * 사장님이 "예약이 없네"라고 판단했는데 사실은 서버가 죽어 있던 상황이
 * 가장 위험하므로, 오류는 반드시 오류로 보이게 합니다.
 */
export function AsyncBoundary({
  loading,
  error,
  empty,
  emptyText = '아직 데이터가 없습니다.',
  onRetry,
  children,
}: {
  loading: boolean
  error: string | null
  empty?: boolean
  emptyText?: string
  onRetry?: () => void
  children: React.ReactNode
}) {
  if (error) {
    return (
      <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
        <p className="text-sm text-red-300">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-ink-700 px-4 py-2 text-xs font-semibold text-ink-300 hover:bg-ink-800"
          >
            다시 시도
          </button>
        )}
      </div>
    )
  }

  // 첫 로딩일 때만 스켈레톤을 보여주고, 갱신 중에는 기존 화면을 유지합니다.
  // 버튼 하나 누를 때마다 화면이 통째로 깜빡이면 쓰기 불편합니다.
  if (loading && !children) {
    return <Skeleton />
  }

  if (empty) {
    return (
      <div className="surface px-6 py-14 text-center text-sm text-ink-500">{emptyText}</div>
    )
  }

  return <>{children}</>
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="surface h-20 animate-pulse bg-ink-900/60" />
      ))}
    </div>
  )
}

/** 목록 위에 겹쳐 띄우는 갱신 표시 */
export function RefreshingBar({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="mb-3 h-0.5 w-full overflow-hidden rounded bg-ink-800">
      <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] bg-brand-500" />
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** 다시 불러오기. 목록을 바꾸는 동작(확정·취소 등) 뒤에 호출합니다. */
  reload: () => void
  /** 서버를 다시 부르지 않고 화면만 먼저 바꿀 때 (낙관적 갱신) */
  setData: (updater: (prev: T | null) => T | null) => void
}

/**
 * 관리자 화면 공용 데이터 로딩.
 *
 * ★ 응답 순서 뒤집힘 방지
 *   필터를 빠르게 바꾸면 요청 A, B 가 연달아 나가는데 A 가 늦게 도착할 수 있습니다.
 *   그대로 두면 화면에 낡은 결과가 남습니다. 매 실행마다 세대(generation)를 올려
 *   자기보다 새 요청이 이미 나갔으면 결과를 버립니다.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setDataState] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  // fn 은 대부분 인라인 화살표 함수라 매 렌더 새로 만들어집니다.
  // deps 를 직접 받아 그걸로만 재실행을 판단합니다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)

    run()
      .then((result) => {
        if (alive) setDataState(result)
      })
      .catch((err) => {
        if (!alive) return
        setError(
          err instanceof ApiError || err instanceof Error
            ? err.message
            : '데이터를 불러오지 못했습니다.',
        )
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [run, nonce])

  return {
    data,
    loading,
    error,
    reload: useCallback(() => setNonce((n) => n + 1), []),
    setData: useCallback((updater: (prev: T | null) => T | null) => {
      setDataState((prev) => updater(prev))
    }, []),
  }
}

'use client'

import { useState, useCallback } from 'react'
import { Memo } from '@/types/memo'
import { supabaseMemos } from '@/utils/supabaseMemos'

interface UseSummarizeReturn {
  summary: string | null
  isLoading: boolean
  error: string | null
  summarize: (memo: Memo, onSaved?: (summary: string) => void) => Promise<void>
  reset: () => void
}

export const useSummarize = (initialSummary?: string | null): UseSummarizeReturn => {
  const [summary, setSummary] = useState<string | null>(initialSummary ?? null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const summarize = useCallback(
    async (memo: Memo, onSaved?: (summary: string) => void): Promise<void> => {
      setIsLoading(true)
      setSummary(null)
      setError(null)

      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: memo.title, content: memo.content }),
        })

        const data: { summary?: string; error?: string } = await response.json()

        if (!response.ok) {
          setError(data.error ?? '요약 중 오류가 발생했습니다.')
          return
        }

        if (!data.summary) {
          setError('요약 결과를 받지 못했습니다.')
          return
        }

        setSummary(data.summary)

        // DB에 저장 후 상위 콜백으로 상태 동기화
        try {
          await supabaseMemos.updateSummary(memo.id, data.summary)
          onSaved?.(data.summary)
        } catch {
          // 요약 표시는 성공했으므로 DB 저장 실패는 조용히 처리
          console.error('요약 DB 저장 실패')
        }
      } catch {
        setError('네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.')
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const reset = useCallback(() => {
    setSummary(initialSummary ?? null)
    setIsLoading(false)
    setError(null)
  }, [initialSummary])

  return { summary, isLoading, error, summarize, reset }
}

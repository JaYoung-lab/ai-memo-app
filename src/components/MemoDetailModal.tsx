'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'
import { useSummarize } from '@/hooks/useSummarize'

const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default.Markdown),
  { ssr: false }
)

interface MemoDetailModalProps {
  memo: Memo | null
  isOpen: boolean
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onSummarySaved?: (id: string, summary: string) => void
}

export default function MemoDetailModal({
  memo,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onSummarySaved,
}: MemoDetailModalProps) {
  const { summary, isLoading, error, summarize, reset } = useSummarize(memo?.summary)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  useEffect(() => {
    reset()
  }, [memo?.id, reset])

  if (!isOpen || !memo) return null

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-green-100 text-green-800',
      study: 'bg-purple-100 text-purple-800',
      idea: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] ?? colors.other
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  const handleEdit = () => {
    onEdit(memo)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${getCategoryColor(memo.category)}`}
              >
                {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] ??
                  memo.category}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight opacity-50">
                {memo.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title="닫기 (ESC)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mb-6 pb-5 border-b border-gray-100">
            <span>작성: {formatDate(memo.createdAt)}</span>
            {memo.createdAt !== memo.updatedAt && (
              <span>수정: {formatDate(memo.updatedAt)}</span>
            )}
          </div>

          {/* 내용 */}
          <div className="mb-6 min-h-[6rem]" data-color-mode="light">
            <MDPreview
              source={memo.content}
              style={{ backgroundColor: 'transparent', fontSize: '0.875rem' }}
            />
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* AI 요약 섹션 */}
          <div className="mb-6 border border-purple-100 rounded-xl bg-purple-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <span className="text-sm font-medium text-purple-700">AI 요약</span>
              </div>
              <button
                data-testid="summarize-memo-btn"
                onClick={() =>
                  summarize(memo, savedSummary => {
                    onSummarySaved?.(memo.id, savedSummary)
                  })
                }
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="w-3 h-3 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    요약 중...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    {summary ? '다시 요약' : '요약하기'}
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            {summary && !error && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
            )}

            {!summary && !error && !isLoading && (
              <p className="text-xs text-purple-400">
                버튼을 눌러 메모 내용을 AI가 요약합니다.
              </p>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-5 border-t border-gray-100">
            <button
              onClick={handleEdit}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              편집
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

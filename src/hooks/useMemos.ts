'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import { supabaseMemos } from '@/utils/supabaseMemos'
import { migrateLocalStorage } from '@/utils/migrateLocalStorage'
import { seedSampleData } from '@/utils/seedData'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        await migrateLocalStorage()
        await seedSampleData()
        const loadedMemos = await supabaseMemos.getMemos()
        setMemos(loadedMemos)
      } catch (error) {
        console.error('Failed to load memos:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // 메모 생성
  const createMemo = useCallback(async (formData: MemoFormData): Promise<Memo> => {
    const id = uuidv4()
    const now = new Date().toISOString()
    const newMemo: Memo = {
      id,
      ...formData,
      createdAt: now,
      updatedAt: now,
    }

    await supabaseMemos.addMemo(newMemo)
    setMemos(prev => [newMemo, ...prev])

    return newMemo
  }, [])

  // 메모 업데이트
  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      const existingMemo = memos.find(memo => memo.id === id)
      if (!existingMemo) return

      const updatedMemo: Memo = {
        ...existingMemo,
        ...formData,
        updatedAt: new Date().toISOString(),
      }

      await supabaseMemos.updateMemo(updatedMemo)
      setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
    },
    [memos]
  )

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    await supabaseMemos.deleteMemo(id)
    setMemos(prev => prev.filter(memo => memo.id !== id))
  }, [])

  // 요약 저장 후 로컬 상태 반영
  const applySummary = useCallback((id: string, summary: string): void => {
    setMemos(prev =>
      prev.map(memo => (memo.id === id ? { ...memo, summary } : memo))
    )
  }, [])

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제
  const clearAllMemos = useCallback(async (): Promise<void> => {
    const allIds = memos.map(m => m.id)
    await Promise.all(allIds.map(id => supabaseMemos.deleteMemo(id)))
    setMemos([])
    setSearchQuery('')
    setSelectedCategory('all')
  }, [memos])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 요약 캐시
    applySummary,

    // 유틸리티
    clearAllMemos,
  }
}

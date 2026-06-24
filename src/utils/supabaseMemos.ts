import { Memo, MemoFormData } from '@/types/memo'
import { supabase } from './supabaseClient'

interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  summary: string | null
  created_at: string
  updated_at: string
}

function rowToMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function memoToRow(memo: Memo): Omit<MemoRow, 'created_at' | 'updated_at'> & {
  created_at: string
  updated_at: string
} {
  return {
    id: memo.id,
    title: memo.title,
    content: memo.content,
    category: memo.category,
    tags: memo.tags,
    summary: memo.summary ?? null,
    created_at: memo.createdAt,
    updated_at: memo.updatedAt,
  }
}

export const supabaseMemos = {
  getMemos: async (): Promise<Memo[]> => {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading memos from Supabase:', error)
      return []
    }

    return (data as MemoRow[]).map(rowToMemo)
  },

  addMemo: async (memo: Memo): Promise<void> => {
    const { error } = await supabase.from('memos').insert(memoToRow(memo))

    if (error) {
      console.error('Error adding memo to Supabase:', error)
      throw error
    }
  },

  updateMemo: async (updatedMemo: Memo): Promise<void> => {
    const { id, ...rest } = memoToRow(updatedMemo)
    const { error } = await supabase.from('memos').update(rest).eq('id', id)

    if (error) {
      console.error('Error updating memo in Supabase:', error)
      throw error
    }
  },

  deleteMemo: async (id: string): Promise<void> => {
    const { error } = await supabase.from('memos').delete().eq('id', id)

    if (error) {
      console.error('Error deleting memo from Supabase:', error)
      throw error
    }
  },

  getMemoById: async (id: string): Promise<Memo | null> => {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error getting memo by id from Supabase:', error)
      return null
    }

    return rowToMemo(data as MemoRow)
  },

  updateSummary: async (id: string, summary: string): Promise<void> => {
    const { error } = await supabase
      .from('memos')
      .update({ summary, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error updating summary in Supabase:', error)
      throw error
    }
  },

  bulkInsert: async (memos: Memo[]): Promise<void> => {
    const rows = memos.map(memoToRow)
    const { error } = await supabase.from('memos').insert(rows)

    if (error) {
      console.error('Error bulk inserting memos to Supabase:', error)
      throw error
    }
  },

  getMemoCount: async (): Promise<number> => {
    const { count, error } = await supabase
      .from('memos')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error getting memo count from Supabase:', error)
      return 0
    }

    return count ?? 0
  },

  addMemoFromFormData: async (id: string, formData: MemoFormData): Promise<Memo> => {
    const now = new Date().toISOString()
    const memo: Memo = {
      id,
      ...formData,
      createdAt: now,
      updatedAt: now,
    }
    await supabaseMemos.addMemo(memo)
    return memo
  },
}

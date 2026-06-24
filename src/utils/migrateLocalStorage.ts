import { Memo } from '@/types/memo'
import { supabaseMemos } from './supabaseMemos'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'

const STORAGE_KEY = 'memo-app-memos'
const MIGRATED_FLAG = 'memo-app-migrated'

function isValidUuid(id: string): boolean {
  return uuidValidate(id)
}

export const migrateLocalStorage = async (): Promise<void> => {
  if (typeof window === 'undefined') return

  const alreadyMigrated = localStorage.getItem(MIGRATED_FLAG)
  if (alreadyMigrated) return

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(MIGRATED_FLAG, 'true')
    return
  }

  let localMemos: Memo[]
  try {
    localMemos = JSON.parse(stored)
  } catch {
    localStorage.setItem(MIGRATED_FLAG, 'true')
    return
  }

  if (!Array.isArray(localMemos) || localMemos.length === 0) {
    localStorage.setItem(MIGRATED_FLAG, 'true')
    return
  }

  // id가 유효 uuid가 아닌 경우(샘플 데이터 '1'~'6') 새 uuid 발급
  const memosToInsert = localMemos.map(memo => ({
    ...memo,
    id: isValidUuid(memo.id) ? memo.id : uuidv4(),
  }))

  try {
    await supabaseMemos.bulkInsert(memosToInsert)
    localStorage.setItem(MIGRATED_FLAG, 'true')
  } catch (error) {
    console.error('Failed to migrate localStorage to Supabase:', error)
  }
}

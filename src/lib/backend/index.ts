import { localBackend } from './local'
import { createSupabaseBackend } from './supabase'
import type { Backend } from './types'

export * from './types'
export { LOCAL_TEACHER_CODE } from './local'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Если в .env заданы ключи Supabase — работаем с общим сервером (ученики и учитель на разных устройствах).
 * Иначе — демо-режим в одном браузере.
 */
export const backend: Backend = url && anonKey ? createSupabaseBackend(url, anonKey) : localBackend

import { flashcards } from '../data/flashcards'
import { theoryModules } from '../data/theory'
import type { Flashcard, FlashcardStatus } from '../types'

export const ALL_MODULES_ID = 'all'

export function getCardsForModule(moduleId: string): Flashcard[] {
  if (moduleId === ALL_MODULES_ID) return flashcards
  return flashcards.filter((card) => card.moduleId === moduleId)
}

export function getModuleTitle(moduleId: string): string {
  if (moduleId === ALL_MODULES_ID) return 'Все модули'
  return theoryModules.find((m) => m.id === moduleId)?.title ?? 'Модуль'
}

export function getModuleIcon(moduleId: string): string {
  if (moduleId === ALL_MODULES_ID) return '🗂️'
  return theoryModules.find((m) => m.id === moduleId)?.icon ?? '📘'
}

export function countStatuses(cards: Flashcard[], statuses: Record<string, FlashcardStatus>) {
  let known = 0
  let learning = 0
  for (const card of cards) {
    const status = statuses[card.id]
    if (status === 'known') known++
    else if (status === 'learning') learning++
  }
  return { known, learning, fresh: cards.length - known - learning, total: cards.length }
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function pluralCards(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'карточка'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'карточки'
  return 'карточек'
}

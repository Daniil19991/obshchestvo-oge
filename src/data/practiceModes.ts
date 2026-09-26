export type PracticeMode = 'exam' | 'marathon' | 'errors'

export interface PracticeModeInfo {
  id: PracticeMode
  title: string
  icon: string
  description: string
  details: string[]
}

export const practiceModes: PracticeModeInfo[] = [
  {
    id: 'exam',
    title: 'Режим экзамена',
    icon: '📋',
    description: 'Полный вариант ОГЭ — все 20 заданий подряд, как на реальном экзамене.',
    details: [
      '12 заданий с кратким ответом + 8 с развёрнутым',
      'Максимум 32 балла, на «5» нужно 28 и больше',
      'Таймер и итоговый разбор после сдачи',
    ],
  },
  {
    id: 'marathon',
    title: 'Марафон',
    icon: '🏃',
    description: 'Непрерывная отработка — решайте задания разных типов без остановки.',
    details: [
      'Выбор количества заданий в сессии',
      'Смешение типов для разнообразия',
      'Статистика серии в конце',
    ],
  },
  {
    id: 'errors',
    title: 'Ошибки',
    icon: '🔄',
    description: 'Повторите задания, в которых допустили ошибки — закрепите слабые места.',
    details: [
      'Только неверно решённые задания',
      'Группировка по модулям и типам',
      'Исчезают после верного ответа',
    ],
  },
]

export const examModeConfig = {
  tasksCount: 20,
  maxScore: 32,
  durationMinutes: 180,
  parts: [
    { label: 'краткий ответ', count: 12 },
    { label: 'развёрнутый ответ', count: 8 },
  ],
}

export const marathonPresets = [10, 20, 30, 50] as const

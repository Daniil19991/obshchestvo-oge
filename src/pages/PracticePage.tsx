import { useMemo, useState } from 'react'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { practiceSlots } from '../data/practice'
import {
  examModeConfig,
  marathonPresets,
  practiceModes,
  type PracticeMode,
} from '../data/practiceModes'
import { theoryModules } from '../data/theory'
import { useStudent } from '../context/StudentContext'

export function PracticePage() {
  const { state } = useStudent()
  const [mode, setMode] = useState<PracticeMode>('exam')
  const [marathonCount, setMarathonCount] = useState<number>(20)

  const loadedCount = practiceSlots.filter((s) => s.tasksLoaded).length
  const tasksReady = loadedCount > 0

  const incorrectAttempts = useMemo(
    () => state.taskAttempts.filter((a) => !a.correct),
    [state.taskAttempts],
  )

  const errorsByModule = useMemo(() => {
    const map = new Map<string, number>()
    for (const attempt of incorrectAttempts) {
      map.set(attempt.moduleId, (map.get(attempt.moduleId) ?? 0) + 1)
    }
    return map
  }, [incorrectAttempts])

  const activeMode = practiceModes.find((m) => m.id === mode)!

  const modeAccent = {
    exam: {
      card: 'border-brand-500 bg-gradient-to-br from-brand-100 to-brand-50 ring-2 ring-brand-300 shadow-lg shadow-brand-100',
      panel: 'border-brand-200 bg-gradient-to-br from-brand-50 to-white',
      stat: 'bg-brand-100 text-brand-700',
      chip: 'bg-brand-200 text-brand-800',
      btn: 'bg-brand-600 hover:bg-brand-700',
    },
    marathon: {
      card: 'border-amber-500 bg-gradient-to-br from-amber-100 to-amber-50 ring-2 ring-amber-300 shadow-lg shadow-amber-100',
      panel: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
      stat: 'bg-amber-100 text-amber-800',
      chip: 'bg-amber-200 text-amber-900',
      btn: 'bg-amber-500 hover:bg-amber-600',
    },
    errors: {
      card: 'border-rose-500 bg-gradient-to-br from-rose-100 to-rose-50 ring-2 ring-rose-300 shadow-lg shadow-rose-100',
      panel: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white',
      stat: 'bg-rose-100 text-rose-800',
      chip: 'bg-rose-200 text-rose-900',
      btn: 'bg-rose-500 hover:bg-rose-600',
    },
  }[mode]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Отработка заданий</h1>
        <p className="text-muted mt-2">Три режима подготовки к ОГЭ по обществознанию</p>
        <div className="mt-4 flex items-center gap-3">
          <Badge variant="brand">ОГЭ</Badge>
          <span className="text-sm text-muted">
            {practiceSlots.length} типов заданий · загружено: {loadedCount}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {practiceModes.map((item) => {
          const isActive = mode === item.id
          const itemAccent = {
            exam: 'border-brand-500 bg-gradient-to-br from-brand-100 to-brand-50 ring-2 ring-brand-300 shadow-lg shadow-brand-100',
            marathon: 'border-amber-500 bg-gradient-to-br from-amber-100 to-amber-50 ring-2 ring-amber-300 shadow-lg shadow-amber-100',
            errors: 'border-rose-500 bg-gradient-to-br from-rose-100 to-rose-50 ring-2 ring-rose-300 shadow-lg shadow-rose-100',
          }[item.id]

          const badge =
            item.id === 'errors' && incorrectAttempts.length > 0
              ? incorrectAttempts.length
              : null

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`rounded-2xl border-2 p-5 sm:p-6 text-left transition-all ${
                isActive
                  ? itemAccent
                  : 'border-border bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-4xl">{item.icon}</span>
                {badge !== null && (
                  <span className="rounded-full bg-rose-500 px-2.5 py-1 text-sm font-bold text-white">
                    {badge}
                  </span>
                )}
              </div>
              <h2 className={`text-xl font-bold mt-3 ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
                {item.title}
              </h2>
              <p className="text-base text-slate-600 mt-2 leading-snug">{item.description}</p>
            </button>
          )
        })}
      </div>

      <Card className={`mb-6 border-2 p-6 sm:p-8 ${modeAccent.panel}`}>
        <div className="flex items-start gap-4 mb-5">
          <span className="text-4xl">{activeMode.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{activeMode.title}</h2>
            <p className="text-lg text-slate-600 mt-2">{activeMode.description}</p>
          </div>
        </div>

        <ul className="space-y-2 mb-8">
          {activeMode.details.map((detail) => (
            <li key={detail} className="flex items-start gap-2 text-base text-slate-700">
              <span className="text-brand-600 font-bold mt-0.5">•</span>
              {detail}
            </li>
          ))}
        </ul>

        {mode === 'exam' && (
          <div>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className={`rounded-xl px-4 py-4 text-center ${modeAccent.stat}`}>
                <div className="text-3xl font-bold">{examModeConfig.tasksCount}</div>
                <div className="text-base font-medium mt-1 opacity-80">заданий</div>
              </div>
              <div className={`rounded-xl px-4 py-4 text-center ${modeAccent.stat}`}>
                <div className="text-3xl font-bold">{examModeConfig.maxScore}</div>
                <div className="text-base font-medium mt-1 opacity-80">макс. балл</div>
              </div>
              <div className={`rounded-xl px-4 py-4 text-center ${modeAccent.stat}`}>
                <div className="text-3xl font-bold">{examModeConfig.durationMinutes}</div>
                <div className="text-base font-medium mt-1 opacity-80">минут</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {examModeConfig.slots.map((n) => (
                <span
                  key={n}
                  className={`rounded-lg px-4 py-2 text-base font-semibold ${modeAccent.chip}`}
                >
                  №{n}
                </span>
              ))}
            </div>
            <button
              type="button"
              disabled={!tasksReady}
              className={`rounded-xl px-8 py-3.5 text-base font-bold text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${modeAccent.btn}`}
            >
              {tasksReady ? 'Начать экзамен' : 'Ожидает загрузки заданий'}
            </button>
          </div>
        )}

        {mode === 'marathon' && (
          <div>
            <p className="text-base font-semibold text-slate-800 mb-4">Количество заданий в сессии</p>
            <div className="flex flex-wrap gap-3 mb-6">
              {marathonPresets.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMarathonCount(count)}
                  className={`rounded-xl px-6 py-3 text-base font-bold transition-colors ${
                    marathonCount === count
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white border-2 border-amber-200 text-amber-900 hover:bg-amber-50'
                  }`}
                >
                  {count} заданий
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!tasksReady}
              className={`rounded-xl px-8 py-3.5 text-base font-bold text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${modeAccent.btn}`}
            >
              {tasksReady ? `Запустить марафон (${marathonCount})` : 'Ожидает загрузки заданий'}
            </button>

            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Или выберите тип задания</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {practiceSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`rounded-xl border p-4 ${slot.tasksLoaded ? 'border-border' : 'border-border opacity-75'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-bold text-sm">
                        №{slot.number}
                      </span>
                      {slot.tasksLoaded ? (
                        <Badge variant="success">Доступно</Badge>
                      ) : (
                        <Badge variant="warning">Скоро</Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-slate-900 mt-2 text-sm">{slot.title}</h4>
                    <p className="text-xs text-muted mt-1 line-clamp-2">{slot.description}</p>
                    <button
                      type="button"
                      disabled={!slot.tasksLoaded}
                      className="mt-3 w-full rounded-lg py-2 text-xs font-medium transition-colors disabled:bg-slate-100 disabled:text-slate-400 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed"
                    >
                      {slot.tasksLoaded ? 'Приступить' : 'Скоро'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'errors' && (
          <div>
            {incorrectAttempts.length === 0 ? (
              <EmptyState
                icon="✨"
                title="Ошибок пока нет"
                description="Здесь появятся задания, которые вы решили неверно. Повторяйте их, чтобы закрепить материал."
              />
            ) : (
              <>
                <div className="rounded-xl bg-rose-100 border-2 border-rose-200 px-5 py-4 mb-6">
                  <span className="text-3xl font-bold text-rose-600">{incorrectAttempts.length}</span>
                  <span className="text-base font-semibold text-rose-800 ml-2">заданий к повторению</span>
                </div>

                <div className="space-y-3 mb-5">
                  {theoryModules.map((module) => {
                    const count = errorsByModule.get(module.id) ?? 0
                    if (count === 0) return null
                    return (
                      <div
                        key={module.id}
                        className="flex items-center justify-between rounded-xl border-2 border-rose-100 bg-white px-5 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{module.icon}</span>
                          <span className="text-base font-semibold text-slate-900">{module.title}</span>
                        </div>
                        <Badge variant="warning">{count} ошибок</Badge>
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  disabled={!tasksReady}
                  className={`rounded-xl px-8 py-3.5 text-base font-bold text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${modeAccent.btn}`}
                >
                  {tasksReady ? 'Повторить ошибки' : 'Ожидает загрузки заданий'}
                </button>
              </>
            )}
          </div>
        )}
      </Card>

      {!tasksReady && mode !== 'errors' && (
        <EmptyState
          icon="📝"
          title="Задания скоро появятся"
          description="Режимы уже готовы — осталось загрузить задания. После этого можно будет начать экзамен, марафон и работу над ошибками."
        />
      )}
    </div>
  )
}

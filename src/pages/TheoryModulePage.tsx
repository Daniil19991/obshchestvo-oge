import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleArt, getModuleTheme } from '../components/ModuleArt'
import { ProgressRing } from '../components/ProgressRing'
import { useStudent } from '../context/StudentContext'
import { theoryModules } from '../data/theory'
import { getCardsForModule, pluralCards } from '../utils/flashcards'
import { getModuleTasks } from '../utils/tasks'

export function TheoryModulePage() {
  const { moduleId } = useParams()
  const { state, toggleLesson } = useStudent()
  const module = theoryModules.find((m) => m.id === moduleId)
  const firstOpen = module?.lessons.find((l) => !state.completedLessons.includes(l.id))?.id
  const [open, setOpen] = useState<string | null>(firstOpen ?? null)

  if (!module) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-center">
        <h1 className="text-xl font-semibold">Модуль не найден</h1>
        <Link to="/theory" className="text-brand-600 hover:underline mt-4 inline-block">
          ← Вернуться к теории
        </Link>
      </div>
    )
  }

  const theme = getModuleTheme(module.id)
  const done = module.lessons.filter((l) => state.completedLessons.includes(l.id)).length
  const progress = Math.round((done / module.lessons.length) * 100)
  const cardsCount = getCardsForModule(module.id).length
  const tasksCount = getModuleTasks(module.id).length

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/theory" className="text-sm font-medium text-muted hover:text-ink">
        ← Все модули
      </Link>

      <header
        className="relative mt-4 overflow-hidden rounded-[28px] p-6 sm:p-8"
        style={{ background: `linear-gradient(135deg, ${theme.soft} 0%, ${theme.soft2} 100%)` }}
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <ModuleArt moduleId={module.id} size={72} className="bg-white/60" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{module.title}</h1>
            <p className="mt-1 hidden text-slate-600 sm:block">{module.description}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-2.5 backdrop-blur sm:p-3">
            <ProgressRing value={progress} size={68} stroke={6} color={theme.accent} label={`${done}/${module.lessons.length}`} />
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600 sm:hidden">{module.description}</p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            to={`/practice/session?module=${module.id}&format=test`}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
            style={{ background: theme.accent }}
          >
            Решать задания · {tasksCount}
          </Link>
          {cardsCount > 0 && (
            <Link
              to={`/practice/cards/${module.id}`}
              className="rounded-xl bg-white/80 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white"
            >
              🃏 Понятия · {cardsCount} {pluralCards(cardsCount)}
            </Link>
          )}
        </div>
      </header>

      <ol className="relative mt-8">
        {module.lessons.map((lesson, index) => {
          const isCompleted = state.completedLessons.includes(lesson.id)
          const isOpen = open === lesson.id
          const isLast = index === module.lessons.length - 1
          return (
            <li key={lesson.id} className="relative flex gap-4 pb-4">
              {!isLast && (
                <span
                  className="absolute left-[17px] top-10 bottom-0 w-0.5 rounded-full"
                  style={{ background: isCompleted ? theme.accent : '#e7e8ef' }}
                />
              )}
              <span
                className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors"
                style={
                  isCompleted
                    ? { background: theme.accent, color: 'white' }
                    : { background: 'white', color: theme.accent, boxShadow: `inset 0 0 0 2px ${theme.soft2}` }
                }
              >
                {isCompleted ? '✓' : index + 1}
              </span>

              <div
                className={`min-w-0 flex-1 rounded-[20px] border bg-white transition-shadow ${
                  isOpen ? 'border-border shadow-lift' : 'border-border/80 shadow-soft'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : lesson.id)}
                  className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="min-w-0">
                    <span className={`block font-semibold ${isCompleted ? 'text-slate-500' : 'text-ink'}`}>{lesson.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{lesson.summary}</span>
                  </span>
                  <span className={`mt-1 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
                </button>

                {isOpen && (
                  <div className="page-in px-5 pb-5">
                    <div
                      className="rounded-2xl p-4 text-[15px] leading-relaxed text-slate-700"
                      style={{ background: theme.soft }}
                    >
                      {lesson.content}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          toggleLesson(lesson.id)
                          if (!isCompleted) {
                            const nextLesson = module.lessons[index + 1]
                            setOpen(nextLesson && !state.completedLessons.includes(nextLesson.id) ? nextLesson.id : null)
                          }
                        }}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                          isCompleted ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'text-white hover:opacity-90'
                        }`}
                        style={isCompleted ? undefined : { background: theme.accent }}
                      >
                        {isCompleted ? 'Отменить отметку' : '✓ Тема изучена'}
                      </button>
                      <span className="text-xs text-muted">≈ {lesson.duration}</span>
                    </div>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

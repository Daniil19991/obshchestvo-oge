import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { ModuleArt, ModuleProgress, getModuleTheme } from '../components/ModuleArt'
import { ProgressRing } from '../components/ProgressRing'
import { useStudent } from '../context/StudentContext'
import { writtenTaskTypes } from '../data/goalPlan'
import { examModeConfig, marathonPresets } from '../data/practiceModes'
import { practiceTasks } from '../data/tasks'
import { theoryModules } from '../data/theory'
import { getErrorTasks, getKindTasks, getModuleTasks } from '../utils/tasks'
import { FlashcardsModuleList } from './FlashcardsPage'

export function PracticePage() {
  const { state } = useStudent()
  const [marathonCount, setMarathonCount] = useState<number>(20)

  const errorTasks = useMemo(() => getErrorTasks(state.taskAttempts), [state.taskAttempts])
  const lastByTask = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const a of state.taskAttempts) if (a.taskId) map.set(a.taskId, a.correct)
    return map
  }, [state.taskAttempts])

  const solvedTotal = lastByTask.size
  const correctTotal = [...lastByTask.values()].filter(Boolean).length
  const accuracy = solvedTotal ? Math.round((correctTotal / solvedTotal) * 100) : 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Задания</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">Отработка заданий ОГЭ</h1>
          <p className="text-muted mt-2">
            {practiceTasks.length} заданий из открытого банка ФИПИ. В варианте {examModeConfig.tasksCount} заданий,
            максимум {examModeConfig.maxScore} балла.
          </p>
        </div>
        <Card className="flex items-center gap-4 px-5 py-4">
          <ProgressRing value={Math.round((solvedTotal / practiceTasks.length) * 100)} size={72} stroke={7} />
          <div className="text-sm">
            <div>
              <strong className="text-2xl text-ink">{solvedTotal}</strong>
              <span className="text-muted"> / {practiceTasks.length} решено</span>
            </div>
            <div className="text-muted">{solvedTotal ? `${accuracy}% верно` : 'начните с любого модуля'}</div>
          </div>
        </Card>
      </div>

      {/* Режимы */}
      <div className="stagger grid gap-4 lg:grid-cols-3 mb-10">
        <ModeCard icon="📝" tint="#eef0ff" title="Пробный вариант" text="Полный вариант ОГЭ: 12 тестовых и 8 письменных заданий, таймер 3 часа.">
          <div className="mb-4 flex flex-wrap gap-1.5 text-xs font-semibold">
            <Chip>{examModeConfig.tasksCount} заданий</Chip>
            <Chip>{examModeConfig.maxScore} балла</Chip>
            <Chip>{examModeConfig.durationMinutes / 60} часа</Chip>
          </div>
          <Link to="/practice/session?mode=exam" className="btn-primary">
            Начать вариант
          </Link>
        </ModeCard>

        <ModeCard icon="⚡" tint="#fff4e3" title="Марафон" text="Задания из всех модулей вперемешку — решайте без остановки.">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {marathonPresets.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setMarathonCount(count)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  marathonCount === count ? 'bg-ink text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <Link to={`/practice/session?mode=marathon&n=${marathonCount}`} className="btn-primary">
            Запустить · {marathonCount}
          </Link>
        </ModeCard>

        <ModeCard icon="🔄" tint="#ffeef2" title="Работа над ошибками" text="Задания, где последний ответ был неверным. Исчезают после верного ответа.">
          <div className="mb-4 text-sm">
            {errorTasks.length ? (
              <span>
                <strong className="text-rose-600">{errorTasks.length}</strong> <span className="text-muted">заданий к повторению</span>
              </span>
            ) : (
              <span className="text-muted">Ошибок пока нет ✨</span>
            )}
          </div>
          {errorTasks.length > 0 ? (
            <Link to="/practice/session?mode=errors" className="btn-primary">
              Повторить ошибки
            </Link>
          ) : (
            <span className="btn-primary pointer-events-none opacity-40">Повторить ошибки</span>
          )}
        </ModeCard>
      </div>

      {/* По модулям */}
      <Collapsible
        title="По модулям"
        subtitle={`15 тестовых и 5 письменных заданий в каждом модуле · решено ${solvedTotal} из ${practiceTasks.length}`}
        preview={
          <div className="flex -space-x-2">
            {theoryModules.map((m) => (
              <ModuleArt key={m.id} moduleId={m.id} size={34} className="ring-2 ring-white" />
            ))}
          </div>
        }
      >
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {theoryModules.map((m) => {
            const all = getModuleTasks(m.id)
            const test = all.filter((t) => t.format === 'test').length
            const written = all.length - test
            const solved = all.filter((t) => lastByTask.has(t.id)).length
            const theme = getModuleTheme(m.id)
            return (
              <Card key={m.id} className="p-5">
                <div className="flex items-center gap-3">
                  <ModuleArt moduleId={m.id} size={48} />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink">{m.title}</h3>
                    <div className="text-xs text-muted">
                      решено <strong style={{ color: theme.accent }}>{solved}</strong> из {all.length}
                    </div>
                  </div>
                </div>
                <ModuleProgress moduleId={m.id} value={(solved / all.length) * 100} className="mt-4" />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    to={`/practice/session?module=${m.id}&format=test`}
                    className="rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: theme.accent }}
                  >
                    Тест · {test}
                  </Link>
                  <Link
                    to={`/practice/session?module=${m.id}&format=written`}
                    className="rounded-xl py-2.5 text-center text-sm font-semibold transition-colors"
                    style={{ background: theme.soft, color: theme.accent }}
                  >
                    Письменные · {written}
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      </Collapsible>

      {/* Письменная часть по типам */}
      <Collapsible
        title="Письменная часть по типам"
        subtitle="Тренируйте конкретный тип задания с развёрнутым ответом"
        preview={
          <div className="flex -space-x-2">
            {writtenTaskTypes.map((t) => (
              <span key={t.id} className="flex h-[34px] w-[34px] items-center justify-center rounded-[28%] bg-amber-50 text-base ring-2 ring-white">
                {t.icon}
              </span>
            ))}
          </div>
        }
      >
        <div className="stagger grid gap-3 grid-cols-2 lg:grid-cols-4">
          {writtenTaskTypes.map((type) => {
            const count = getKindTasks(type.id).length
            return count ? (
              <Link key={type.id} to={`/practice/session?kind=${type.id}`}>
                <Card hover className="flex h-full items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">{type.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug text-ink">{type.title}</span>
                    <span className="block text-xs text-muted">{count} зад.</span>
                  </span>
                </Card>
              </Link>
            ) : (
              <Card key={type.id} className="flex h-full items-center gap-3 p-4 opacity-60">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">{type.icon}</span>
                <span className="text-sm font-semibold text-ink">{type.title}</span>
              </Card>
            )
          })}
        </div>
      </Collapsible>

      <FlashcardsModuleList />
    </div>
  )
}

function Collapsible({
  title,
  subtitle,
  preview,
  children,
}: {
  title: string
  subtitle: string
  preview: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center gap-4 rounded-[22px] border border-border/80 bg-white px-5 py-4 text-left shadow-soft transition-all hover:shadow-lift ${
          open ? 'mb-4' : ''
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-ink">{title}</span>
          <span className="block text-sm text-muted">{subtitle}</span>
        </span>
        <span className="hidden sm:block">{preview}</span>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        >
          ⌄
        </span>
      </button>
      {open && <div className="page-in">{children}</div>}
    </section>
  )
}

function ModeCard({ icon, tint, title, text, children }: { icon: string; tint: string; title: string; text: string; children: ReactNode }) {
  return (
    <Card className="flex h-full flex-col p-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: tint }}>
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 mb-4 flex-1 text-sm text-muted">{text}</p>
      {children}
    </Card>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-brand-700">{children}</span>
}

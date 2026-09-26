import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { ModuleArt, ModuleProgress, getModuleTheme } from '../components/ModuleArt'
import { ProgressRing } from '../components/ProgressRing'
import { useStudent } from '../context/StudentContext'
import { GOAL_EXAM_DATE, goalModuleBlocks } from '../data/goalPlan'
import { flashcards } from '../data/flashcards'
import { theoryModules } from '../data/theory'
import { getDaysUntilExam, getGoalProgress, getNextTopic } from '../utils/goalProgress'
import { getModuleTasks } from '../utils/tasks'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function plural(n: number, one: string, few: string, many: string) {
  const a = n % 10
  const b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}

export function HomePage() {
  const { state } = useStudent()
  const goal = getGoalProgress(state.goal)
  const next = getNextTopic(state.goal)
  const nextBlock = next ? goalModuleBlocks.find((b) => b.moduleId === next.moduleId) : undefined
  const days = getDaysUntilExam(state.goal.examDate || GOAL_EXAM_DATE)
  const firstName = state.profile.name.split(/\s+/)[0]
  const solved = new Set(state.taskAttempts.map((a) => a.taskId).filter(Boolean)).size
  const cardsKnown = Object.values(state.flashcards).filter((s) => s === 'known').length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Приветствие */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-lift sm:p-10">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#ffc4a0]/25 blur-3xl" />

        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/70">
              {greeting()}, {firstName}
              {days !== null && (
                <>
                  {' '}
                  · до ОГЭ {days} {plural(days, 'день', 'дня', 'дней')}
                </>
              )}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              {next ? 'Продолжим подготовку?' : 'Все темы пройдены — время повторять'}
            </h1>

            {next && nextBlock && (
              <Link
                to={`/theory/${next.moduleId}`}
                className="group mt-6 flex w-full max-w-xl items-center gap-3 sm:gap-4 rounded-2xl bg-white/12 p-3 pr-5 ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20"
              >
                <ModuleArt moduleId={next.moduleId} size={52} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-white/60">Следующая тема</span>
                  <span className="block text-base font-semibold leading-snug sm:text-lg sm:truncate">{next.title}</span>
                  <span className="block text-sm text-white/70">
                    {nextBlock.title} · тема {next.number} из {nextBlock.topicsTotal}
                  </span>
                </span>
                <span className="text-2xl transition-transform group-hover:translate-x-1">→</span>
              </Link>
            )}

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link to="/practice" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-soft transition-transform hover:-translate-y-0.5">
                Решать задания
              </Link>
              <Link to="/practice/cards/all" className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/20">
                Повторить понятия
              </Link>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-4 rounded-3xl bg-white/95 p-4 text-ink shadow-soft sm:gap-5 sm:p-5 lg:flex-col lg:p-6">
            <ProgressRing value={goal.overallPercent} size={96} stroke={8} label="к цели" />
            <div className="grid gap-2 text-sm">
              <HeroStat value={`${goal.topicsDone}/${goal.topicsTotal}`} label="тем изучено" />
              <HeroStat value={`${solved}`} label={`${plural(solved, 'задание', 'задания', 'заданий')} решено`} />
              <HeroStat value={`${cardsKnown}/${flashcards.length}`} label="понятий выучено" />
            </div>
          </div>
        </div>
      </section>

      {/* Модули */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">Модули курса</h2>
            <p className="text-sm text-muted mt-1">Теория, задания и понятия по каждой сфере общества</p>
          </div>
          <Link to="/theory" className="shrink-0 whitespace-nowrap text-sm font-semibold text-brand-600 hover:text-brand-700">
            Вся теория →
          </Link>
        </div>

        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {theoryModules.map((module) => {
            const done = module.lessons.filter((l) => state.completedLessons.includes(l.id)).length
            const pct = Math.round((done / module.lessons.length) * 100)
            const tasks = getModuleTasks(module.id).length
            const theme = getModuleTheme(module.id)
            return (
              <Link key={module.id} to={`/theory/${module.id}`}>
                <Card hover className="h-full p-5">
                  <div className="flex items-start gap-4">
                    <ModuleArt moduleId={module.id} size={56} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-ink">{module.title}</h3>
                      <p className="mt-1 text-xs text-muted line-clamp-2">{module.description}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: theme.accent }}>
                      {done}/{module.lessons.length} тем
                    </span>
                    <span className="text-muted">{tasks} заданий</span>
                  </div>
                  <ModuleProgress moduleId={module.id} value={pct} className="mt-2" />
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Быстрый старт */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-ink">Быстрый старт</h2>
        <div className="stagger grid gap-4 sm:grid-cols-3">
          <QuickTile
            to="/practice/session?mode=marathon&n=10"
            title="Марафон на 10 минут"
            text="10 случайных заданий из всех модулей"
            from="#eef0ff"
            to2="#dfe3ff"
            icon="⚡"
          />
          <QuickTile
            to="/practice/cards/all"
            title="Карточки с понятиями"
            text={`${flashcards.length} терминов — переворачивай и запоминай`}
            from="#fff1ea"
            to2="#ffe0d1"
            icon="🃏"
          />
          <QuickTile
            to="/practice/session?mode=exam"
            title="Пробный вариант"
            text="20 заданий, 3 часа — как на экзамене"
            from="#e8f6f2"
            to2="#d2efe7"
            icon="📝"
          />
        </div>
      </section>
    </div>
  )
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="min-w-11 text-base font-bold text-ink">{value}</span>
      <span className="text-muted">{label}</span>
    </div>
  )
}

function QuickTile({ to, title, text, from, to2, icon }: { to: string; title: string; text: string; from: string; to2: string; icon: string }) {
  return (
    <Link to={to}>
      <Card hover className="h-full p-5">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
          style={{ background: `linear-gradient(135deg, ${from}, ${to2})` }}
        >
          {icon}
        </span>
        <h3 className="mt-4 font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-muted">{text}</p>
      </Card>
    </Link>
  )
}

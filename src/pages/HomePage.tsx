import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { ProgressRing } from '../components/ProgressRing'
import { useStudent } from '../context/StudentContext'
import { practiceSlots } from '../data/practice'
import { goalMockExamTargets } from '../data/goalPlan'
import { theoryModules } from '../data/theory'
import { getGoalProgress } from '../utils/goalProgress'

export function HomePage() {
  const { state, theoryProgress, completedLessonsCount, totalLessons } = useStudent()
  const goalProgress = getGoalProgress(state.goal)

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-10 h-48 w-48 rounded-full bg-accent-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Badge variant="brand">
            <span className="bg-brand-500/20 text-white px-2 py-0.5 rounded-full text-xs">
              ОГЭ · ЕГЭ
            </span>
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl max-w-2xl">
            Подготовка к экзамену по обществознанию
          </h1>
          <p className="mt-4 text-lg text-brand-100 max-w-xl">
            Теория по модулям, отработка заданий формата ОГЭ, личный кабинет и отслеживание цели — всё в одном месте.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/theory"
              className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow hover:bg-brand-50 transition-colors"
            >
              Начать с теории
            </Link>
            <Link
              to="/practice"
              className="inline-flex items-center rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              К заданиям
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Ваш прогресс</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center gap-4">
              <ProgressRing value={theoryProgress} label="теория" />
              <div>
                <div className="text-sm text-muted">Теория</div>
                <div className="text-lg font-semibold">
                  {completedLessonsCount} / {totalLessons} уроков
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="text-3xl font-bold text-brand-600">{practiceSlots.length}</div>
            <div className="text-sm text-muted mt-1">Слотов для заданий ОГЭ</div>
            <div className="text-xs text-amber-600 mt-2">Задания загружаются позже</div>
          </Card>
          <Card>
            <div className="text-3xl font-bold text-brand-600">{goalMockExamTargets.total}+</div>
            <div className="text-sm text-muted mt-1">Целевой балл пробника</div>
            <Link to="/goals" className="text-xs text-brand-600 hover:underline mt-2 inline-block">
              Моя цель →
            </Link>
          </Card>
          <Card>
            <div className="text-3xl font-bold text-brand-600">
              {goalProgress.topicsDone}/{goalProgress.topicsTotal}
            </div>
            <div className="text-sm text-muted mt-1">Тем изучено по цели</div>
          </Card>
        </div>
      </section>

      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Разделы платформы</h2>
          <p className="text-muted mb-8">Выберите направление подготовки</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                to: '/theory',
                icon: '📖',
                title: 'Теория',
                desc: `${theoryModules.length} модулей, ${totalLessons} уроков`,
              },
              {
                to: '/practice',
                icon: '✏️',
                title: 'Задания',
                desc: 'Отработка по типам заданий ОГЭ',
              },
              {
                to: '/cabinet',
                icon: '👤',
                title: 'Личный кабинет',
                desc: 'Портфолио и диаграмма усвоения',
              },
              {
                to: '/goals',
                icon: '🎯',
                title: 'Моя цель',
                desc: 'План и отслеживание результата',
              },
            ].map((item) => (
              <Link key={item.to} to={item.to}>
                <Card hover className="h-full">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-muted mt-1">{item.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Модули ОГЭ</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {theoryModules.map((module) => {
            const done = module.lessons.filter((l) =>
              state.completedLessons.includes(l.id),
            ).length
            return (
              <Link key={module.id} to={`/theory/${module.id}`}>
                <Card hover>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{module.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900">{module.title}</h3>
                      <p className="text-xs text-muted mt-1 line-clamp-2">{module.description}</p>
                      <div className="mt-2 text-xs text-brand-600">
                        {done}/{module.lessons.length} уроков
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

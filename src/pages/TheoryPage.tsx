import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { ModuleArt, ModuleProgress, getModuleTheme } from '../components/ModuleArt'
import { ProgressRing } from '../components/ProgressRing'
import { useStudent } from '../context/StudentContext'
import { theoryModules } from '../data/theory'

export function TheoryPage() {
  const { state, completedLessonsCount, totalLessons, theoryProgress } = useStudent()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Теория</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">Шесть модулей — {totalLessons} тем</h1>
          <p className="text-muted mt-2">
            Изучайте темы по порядку и отмечайте пройденные — прогресс сразу появится в разделе «Моя цель».
          </p>
        </div>
        <Card className="flex items-center gap-4 px-5 py-4">
          <ProgressRing value={theoryProgress} size={72} stroke={7} />
          <div>
            <div className="text-2xl font-bold text-ink">
              {completedLessonsCount}
              <span className="text-base font-medium text-muted"> / {totalLessons}</span>
            </div>
            <div className="text-sm text-muted">тем изучено</div>
          </div>
        </Card>
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-2">
        {theoryModules.map((module, i) => {
          const done = module.lessons.filter((l) => state.completedLessons.includes(l.id)).length
          const progress = Math.round((done / module.lessons.length) * 100)
          const theme = getModuleTheme(module.id)

          return (
            <Link key={module.id} to={`/theory/${module.id}`}>
              <Card hover className="relative h-full overflow-hidden p-6">
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-60 blur-2xl"
                  style={{ background: theme.soft2 }}
                />
                <div className="relative flex items-start gap-4">
                  <ModuleArt moduleId={module.id} size={64} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
                      Модуль {i + 1}
                    </div>
                    <h2 className="mt-0.5 text-lg font-bold text-ink">{module.title}</h2>
                    <p className="mt-1 text-sm text-muted">{module.description}</p>
                  </div>
                  {progress === 100 && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Готово ✓</span>
                  )}
                </div>
                <div className="relative mt-5 flex justify-between text-xs text-muted">
                  <span>{module.lessons.length} тем</span>
                  <span>
                    <strong className="text-ink">{done}</strong> пройдено
                  </span>
                </div>
                <ModuleProgress moduleId={module.id} value={progress} className="relative mt-2" />
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

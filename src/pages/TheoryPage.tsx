import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { useStudent } from '../context/StudentContext'
import { theoryModules } from '../data/theory'

export function TheoryPage() {
  const { state, completedLessonsCount, totalLessons, theoryProgress } = useStudent()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Теория</h1>
        <p className="text-muted mt-2">
          Уроки по всем модулям кодификатора ОГЭ. Отмечайте пройденные уроки по мере изучения.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Badge variant="brand">ОГЭ</Badge>
          <span className="text-sm text-muted">
            Прогресс: {completedLessonsCount} / {totalLessons} ({theoryProgress}%)
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${theoryProgress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {theoryModules.map((module) => {
          const done = module.lessons.filter((l) => state.completedLessons.includes(l.id)).length
          const progress = Math.round((done / module.lessons.length) * 100)

          return (
            <Link key={module.id} to={`/theory/${module.id}`}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{module.icon}</span>
                    <div>
                      <h2 className="font-semibold text-slate-900">{module.title}</h2>
                      <p className="text-sm text-muted mt-1">{module.description}</p>
                    </div>
                  </div>
                  {progress === 100 && <Badge variant="success">Готово</Badge>}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>{module.lessons.length} уроков</span>
                    <span>{done} пройдено</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-400 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-6 text-center">
        <p className="text-sm text-brand-800">
          Раздел ЕГЭ будет добавлен позже — структура уже готова к расширению.
        </p>
      </div>
    </div>
  )
}

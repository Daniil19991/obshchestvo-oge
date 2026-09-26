import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { useStudent } from '../context/StudentContext'
import { theoryModules } from '../data/theory'

export function TheoryModulePage() {
  const { moduleId } = useParams()
  const { state, toggleLesson } = useStudent()

  const module = theoryModules.find((m) => m.id === moduleId)

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

  const done = module.lessons.filter((l) => state.completedLessons.includes(l.id)).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/theory" className="text-sm text-brand-600 hover:underline">
        ← Все модули
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <span className="text-4xl">{module.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{module.title}</h1>
          <p className="text-muted mt-1">{module.description}</p>
          <div className="mt-2 flex gap-2">
            <Badge variant="brand">ОГЭ</Badge>
            <Badge variant={done === module.lessons.length ? 'success' : 'default'}>
              {done}/{module.lessons.length} уроков
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {module.lessons.map((lesson, index) => {
          const isCompleted = state.completedLessons.includes(lesson.id)
          return (
            <Card key={lesson.id}>
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{lesson.title}</h2>
                    <span className="text-xs text-muted">{lesson.duration}</span>
                  </div>
                  <p className="text-sm text-muted mt-1">{lesson.summary}</p>
                  <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed">
                    {lesson.content}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleLesson(lesson.id)}
                    className={`mt-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    {isCompleted ? 'Отменить прохождение' : 'Отметить как пройденный'}
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

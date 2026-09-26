import { useState } from 'react'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { ModuleRadarChart } from '../components/ModuleRadarChart'
import { ProgressRing } from '../components/ProgressRing'
import { useStudent } from '../context/StudentContext'
import { theoryModules } from '../data/theory'
import { MASTERY_LEGEND } from '../utils/moduleMastery'

export function CabinetPage() {
  const {
    state,
    updateProfile,
    theoryProgress,
    completedLessonsCount,
    totalLessons,
    moduleMastery,
  } = useStudent()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(state.profile)

  const handleSave = () => {
    updateProfile(form)
    setEditing(false)
  }

  const completedModules = theoryModules.filter((module) =>
    module.lessons.every((l) => state.completedLessons.includes(l.id)),
  )

  const avgMastery = Math.round(
    moduleMastery.reduce((sum, m) => sum + m.value, 0) / moduleMastery.length,
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Личный кабинет</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-white text-2xl font-bold">
                {state.profile.avatarInitials}
              </div>
              {!editing ? (
                <>
                  <h2 className="mt-4 text-xl font-semibold">{state.profile.name}</h2>
                  <p className="text-sm text-muted mt-1">
                    {state.profile.grade} класс · {state.profile.school}
                  </p>
                  <p className="text-sm text-slate-600 mt-3">{state.profile.bio}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(state.profile)
                      setEditing(true)
                    }}
                    className="mt-4 text-sm text-brand-600 hover:underline"
                  >
                    Редактировать профиль
                  </button>
                </>
              ) : (
                <div className="mt-4 w-full space-y-3 text-left">
                  <label className="block">
                    <span className="text-xs text-muted">Имя</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted">Класс</span>
                    <input
                      type="number"
                      min={8}
                      max={11}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted">Школа</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                      value={form.school}
                      onChange={(e) => setForm({ ...form, school: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted">О себе</span>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm resize-none"
                      rows={3}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="mt-4">
            <h3 className="font-semibold text-slate-900 mb-3">Статистика</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Уроков пройдено</span>
                <span className="font-medium">{completedLessonsCount}/{totalLessons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Модулей завершено</span>
                <span className="font-medium">{completedModules.length}/{theoryModules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Среднее усвоение</span>
                <span className="font-medium">{avgMastery}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Попыток в заданиях</span>
                <span className="font-medium">{state.taskAttempts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Достижений</span>
                <span className="font-medium">{state.achievements.length}</span>
              </div>
            </div>
          </Card>

          <Card className="mt-4">
            <h3 className="font-semibold text-slate-900 mb-4">Достижения</h3>
            <div className="space-y-3">
              {state.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <div className="font-medium text-slate-900 text-sm">{achievement.title}</div>
                    <div className="text-xs text-muted mt-0.5">{achievement.description}</div>
                    {achievement.unlockedAt && (
                      <div className="text-[10px] text-muted mt-1">
                        {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="relative overflow-hidden">
            <div className="pr-28 sm:pr-32 mb-2">
              <h3 className="font-semibold text-slate-900">Диаграмма усвоения модулей</h3>
              <p className="text-sm text-muted mt-1 max-w-xl">
                6 лучей — по одному на каждый модуль ОГЭ. Растёт при изучении уроков и верных ответах, снижается при ошибках.
              </p>
            </div>

            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
              <ProgressRing value={avgMastery} size={108} stroke={8} label="среднее" />
            </div>

            <div className="flex justify-center -mt-1">
              <ModuleRadarChart data={moduleMastery} size={400} />
            </div>

            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted">
              <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">{MASTERY_LEGEND.lesson}</span>
              <span className="rounded-full bg-brand-50 text-brand-700 px-3 py-1">{MASTERY_LEGEND.correct}</span>
              <span className="rounded-full bg-red-50 text-red-600 px-3 py-1">{MASTERY_LEGEND.incorrect}</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Портфолио</h3>
              <ProgressRing value={theoryProgress} size={64} stroke={5} />
            </div>
            <p className="text-sm text-muted mt-2">
              Ваши результаты и прогресс подготовки к экзамену
            </p>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Пройденные модули</h4>
              {completedModules.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {completedModules.map((m) => (
                    <Badge key={m.id} variant="success">
                      {m.icon} {m.title}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Пока нет полностью пройденных модулей</p>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-slate-700 mb-3">История заданий</h4>
              {state.practiceHistory.length > 0 ? (
                <div className="space-y-2">
                  {state.practiceHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span>{record.slotTitle}</span>
                      <span className="font-medium">
                        {record.score}/{record.maxScore}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Результаты появятся после загрузки и решения заданий
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

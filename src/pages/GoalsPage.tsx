import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { ModuleArt } from '../components/ModuleArt'
import { MockExamChart } from '../components/MockExamChart'
import { ModuleRadarChart } from '../components/ModuleRadarChart'
import { ProgressRing } from '../components/ProgressRing'
import { useStudent } from '../context/StudentContext'
import {
  GOAL_EXAM_DATE,
  OGE_MAX_SCORE,
  getGrade,
  goalMockExamTargets,
  gradeScale,
  goalModuleBlocks,
  writtenTaskTypes,
} from '../data/goalPlan'
import {
  getDaysUntilExam,
  getGoalProgress,
  getModuleTopicProgress,
  getNextTopic,
} from '../utils/goalProgress'
import { ALL_MODULES_ID, countStatuses, getCardsForModule } from '../utils/flashcards'
import { MASTERY_LEGEND } from '../utils/moduleMastery'

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function PlanStep({
  icon,
  title,
  hint,
  value,
  max,
  valueLabel,
  done,
}: {
  icon: string
  title: ReactNode
  hint?: ReactNode
  value: number
  max: number
  valueLabel: ReactNode
  done: boolean
}) {
  const percent = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <li className={`rounded-xl px-3 py-2.5 ${done ? 'bg-emerald-50' : 'bg-white/80'}`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${
            done ? 'bg-emerald-500 text-white' : 'bg-brand-50'
          }`}
        >
          {done ? '✓' : icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-semibold leading-tight text-slate-900">{title}</span>
            <span className={`shrink-0 text-sm font-bold ${done ? 'text-emerald-600' : 'text-brand-600'}`}>
              {valueLabel}
            </span>
          </div>
          {hint && <div className="text-xs text-muted mt-0.5">{hint}</div>}
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-brand-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </li>
  )
}

const gradeColors: Record<number, { bar: string; text: string; badge: string }> = {
  2: { bar: 'bg-rose-400', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
  3: { bar: 'bg-amber-400', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  4: { bar: 'bg-sky-400', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' },
  5: { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
}

function GradeScale({ score }: { score: number | null }) {
  const total = OGE_MAX_SCORE + 1
  return (
    <div>
      <div className="relative">
        <div className="flex h-7 overflow-hidden rounded-lg">
          {gradeScale.map((g) => (
            <div
              key={g.grade}
              className={`flex items-center justify-center text-sm font-bold text-white ${gradeColors[g.grade].bar}`}
              style={{ width: `${((g.max - g.min + 1) / total) * 100}%` }}
            >
              {g.grade}
            </div>
          ))}
        </div>
        {score !== null && (
          <div
            className="absolute -top-1.5 -bottom-1.5 w-1 -translate-x-1/2 rounded-full bg-slate-900 ring-2 ring-white"
            style={{ left: `${((Math.min(score, OGE_MAX_SCORE) + 0.5) / total) * 100}%` }}
            title={`Твой результат: ${score}`}
          />
        )}
      </div>
      <div className="mt-1 flex text-[11px] text-muted">
        {gradeScale.map((g) => (
          <div key={g.grade} className="text-center" style={{ width: `${((g.max - g.min + 1) / total) * 100}%` }}>
            {g.min}–{g.max}
          </div>
        ))}
      </div>
      {score !== null && (
        <div className="mt-1 text-center text-xs text-slate-600">
          ▲ твой пробник: <strong>{score}</strong>
        </div>
      )}
    </div>
  )
}

function GradeBadge({ grade }: { grade: number }) {
  return (
    <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${gradeColors[grade].badge}`}>
      <span className="text-[10px] font-semibold uppercase leading-none">оценка</span>
      <span className="text-3xl font-extrabold leading-none mt-1">{grade}</span>
    </div>
  )
}

export function GoalsPage() {
  const { state, toggleGoalTopic, toggleGoalTask, updateMockExam, updateMonthlyMockExam, moduleMastery } = useStudent()
  const { goal } = state
  const progress = getGoalProgress(goal)
  const daysUntilExam = getDaysUntilExam(goal.examDate || GOAL_EXAM_DATE)
  const examDateFormatted = new Date(goal.examDate || GOAL_EXAM_DATE).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const mockTotal = goal.mockExam.test + goal.mockExam.written
  const currentGrade = getGrade(mockTotal)
  const topicsLeft = progress.topicsTotal - progress.topicsDone
  const weeksLeft = daysUntilExam ? Math.floor(daysUntilExam / 7) : 0
  const topicsPerWeek = weeksLeft > 0 ? Math.max(1, Math.ceil(topicsLeft / weeksLeft)) : 0
  const nextTopic = getNextTopic(goal)
  const nextBlock = nextTopic ? goalModuleBlocks.find((b) => b.moduleId === nextTopic.moduleId) : undefined
  const allCards = getCardsForModule(ALL_MODULES_ID)
  const cardStats = countStatuses(allCards, state.flashcards)
  const cardsPercent = cardStats.total ? Math.round((cardStats.known / cardStats.total) * 100) : 0
  const avgMastery = Math.round(
    moduleMastery.reduce((sum, m) => sum + m.value, 0) / moduleMastery.length,
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Моя цель</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">«5» на ОГЭ по обществознанию</h1>
        <p className="text-muted mt-2">Темы, письменная часть и пробники — всё, что ведёт к цели</p>
      </div>

      {nextTopic && nextBlock ? (
        <div className="mb-6 flex flex-col gap-3 rounded-[22px] border border-border/80 bg-white px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <ModuleArt moduleId={nextTopic.moduleId} size={48} />
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Следующая тема</div>
              <div className="text-lg font-bold text-slate-900 leading-snug">{nextTopic.title}</div>
              <div className="text-sm text-muted mt-0.5">
                {nextBlock.title} · тема {nextTopic.number} из {nextBlock.topicsTotal}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              to={`/theory/${nextTopic.moduleId}`}
              className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              К теории
            </Link>
            <button
              type="button"
              onClick={() => toggleGoalTopic(nextTopic.id)}
              className="btn-primary"
            >
              ✓ Изучил
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
          🎉 Все темы изучены — осталось повторение перед экзаменом!
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="py-4 px-4 bg-gradient-to-br from-brand-50 to-white border-brand-100">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-600">До ОГЭ осталось</div>
              {daysUntilExam !== null && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-brand-600">{daysUntilExam}</span>
                  <span className="text-lg font-semibold text-slate-700">
                    {plural(daysUntilExam, 'день', 'дня', 'дней')}
                  </span>
                </div>
              )}
            </div>
            <div className="rounded-xl bg-white border border-brand-100 px-2.5 py-1.5 text-center">
              <div className="text-[11px] text-muted leading-none">экзамен</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{examDateFormatted}</div>
            </div>
          </div>

          {topicsLeft > 0 && weeksLeft > 0 && (
            <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              ⏱️ Чтобы успеть, проходи примерно{' '}
              <strong>
                {topicsPerWeek} {plural(topicsPerWeek, 'тему', 'темы', 'тем')} в неделю
              </strong>
            </div>
          )}

          <div className="mt-3 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Что нужно сделать к экзамену
          </div>
          <ul className="space-y-2">
            <PlanStep
              icon="📚"
              title="Изучить все темы"
              value={progress.topicsDone}
              max={progress.topicsTotal}
              valueLabel={`${progress.topicsDone} из ${progress.topicsTotal}`}
              done={progress.allModulesComplete}
            />
            <PlanStep
              icon="✍️"
              title="Научиться решать письменную часть"
              hint="задания с развёрнутым ответом"

              value={progress.tasksDone}
              max={progress.tasksTotal}
              valueLabel={`${progress.tasksDone} из ${progress.tasksTotal}`}
              done={progress.allTasksComplete}
            />
            <PlanStep
              icon="🏆"
              title={`Набрать на пробнике ${goalMockExamTargets.total}+`}
              hint={mockTotal > 0 ? `сейчас это оценка «${currentGrade.grade}»` : 'впиши результат пробника ниже'}
              value={mockTotal}
              max={goalMockExamTargets.total}
              valueLabel={`${mockTotal} ${plural(mockTotal, 'балл', 'балла', 'баллов')}`}
              done={progress.mockExamMet}
            />
          </ul>
        </Card>

        <Card className="flex flex-col justify-center py-4">
          <div className="text-center">
            <div className="text-sm font-medium text-slate-600">Моя цель на экзамене</div>
            <div className="mt-1 flex items-baseline justify-center gap-2">
              <span className="text-4xl font-extrabold text-brand-600">{goalMockExamTargets.total}+</span>
              <span className="text-lg font-semibold text-slate-700">баллов</span>
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              это оценка «{goalMockExamTargets.grade}»
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 text-center">
              Баллы → оценка (максимум {OGE_MAX_SCORE})
            </div>
            <GradeScale score={mockTotal > 0 ? mockTotal : null} />
          </div>
        </Card>

        <Card className="py-4 flex flex-col justify-center">
          <h3 className="font-semibold text-slate-900 mb-3 text-center text-base">Прогресс цели</h3>
          <div className="flex justify-center gap-3 flex-wrap">
            <ProgressRing value={progress.topicsPercent} label="темы" />
            <ProgressRing value={progress.tasksPercent} label="задания" />
            <ProgressRing value={progress.mockExamPercent} label="пробник" />
          </div>
          <div className="mt-3 text-center">
            <div className="text-2xl font-bold text-slate-900">{progress.overallPercent}%</div>
            <div className="text-sm text-muted">общий прогресс</div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🃏</span>
            <h2 className="font-semibold text-slate-900 text-lg">Понятия по карточкам</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">
              изучено <strong className="text-slate-900">{cardStats.known}</strong> из {cardStats.total} ({cardsPercent}%)
            </span>
            <Link to={`/practice/cards/${ALL_MODULES_ID}`} className="text-sm font-semibold text-violet-700 hover:text-violet-800">
              Учить →
            </Link>
          </div>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{ width: `${cardsPercent}%` }}
          />
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="font-semibold text-slate-900 text-xl mb-4">Результаты пробников по месяцам</h2>
        <MockExamChart
          data={goal.mockExamByMonth}
          onUpdate={updateMonthlyMockExam}
        />
      </Card>

      <Card className="mb-6 relative overflow-hidden">
        <div className="pr-28 sm:pr-32 mb-2">
          <h2 className="font-semibold text-slate-900 text-xl">Диаграмма усвоения модулей</h2>
          <p className="text-sm text-muted mt-1 max-w-xl">
            6 лучей — по одному на каждый модуль. Растёт при изучении уроков и верных ответах.
          </p>
        </div>

        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
          <ProgressRing value={avgMastery} size={108} stroke={8} label="среднее" />
        </div>

        <div className="flex justify-center -mt-1">
          <ModuleRadarChart data={moduleMastery} size={400} />
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm text-muted">
          <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">{MASTERY_LEGEND.lesson}</span>
          <span className="rounded-full bg-brand-50 text-brand-700 px-3 py-1">{MASTERY_LEGEND.correct}</span>
          <span className="rounded-full bg-red-50 text-red-600 px-3 py-1">{MASTERY_LEGEND.incorrect}</span>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="font-semibold text-slate-900 text-lg">Блок-модули: расписание тем</h2>
          <span className="text-sm text-muted">
            {progress.topicsDone}/{progress.topicsTotal} тем
          </span>
        </div>
        <p className="text-sm text-muted mb-3">
          Темы идут по порядку. Можно переходить в другой модуль — следующая тема определяется по последней отмеченной.
        </p>
        <div className="h-2 rounded-full bg-slate-100 mb-6">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${progress.topicsPercent}%` }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {goalModuleBlocks.map((block) => {
            const done = getModuleTopicProgress(goal, block.moduleId)
            const complete = done >= block.topicsTotal
            const percent = Math.round((done / block.topicsTotal) * 100)

            return (
              <div
                key={block.moduleId}
                className={`rounded-xl border p-4 ${
                  complete ? 'border-emerald-200 bg-emerald-50/50' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ModuleArt moduleId={block.moduleId} size={36} />
                    <span className="font-semibold text-slate-900 truncate">{block.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-brand-600">
                      {done}/{block.topicsTotal}
                    </span>
                    {complete && <Badge variant="success">Готово</Badge>}
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 mb-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : 'bg-brand-400'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <ol className="space-y-1">
                  {block.topics.map((topic) => {
                    const checked = goal.completedTopics.includes(topic.id)
                    const isNext = nextTopic?.id === topic.id
                    return (
                      <li key={topic.id}>
                        <button
                          type="button"
                          onClick={() => toggleGoalTopic(topic.id)}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                            isNext ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                              checked
                                ? 'bg-brand-600 text-white'
                                : isNext
                                  ? 'border-2 border-brand-400 bg-white text-brand-600'
                                  : 'border-2 border-slate-200 bg-white text-slate-400'
                            }`}
                          >
                            {checked ? '✓' : topic.number}
                          </span>
                          <span
                            className={`flex-1 leading-snug ${
                              checked ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'
                            } ${isNext ? 'font-semibold text-slate-900' : ''}`}
                          >
                            {topic.title}
                          </span>
                          {isNext && (
                            <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                              далее
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-slate-900">Письменная часть: решаю уверенно</h2>
            <span className="text-sm text-muted">
              {progress.tasksDone}/{progress.tasksTotal}
            </span>
          </div>
          <p className="text-sm text-muted mb-4">
            Отмечай тип задания, когда решаешь его без ошибок
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {writtenTaskTypes.map((task) => {
              const done = goal.completedTaskTypes.includes(task.id)
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleGoalTask(task.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    done
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-base">{done ? '✓' : task.icon}</span>
                  {task.title}
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900 mb-1">Мой последний пробник</h2>
          <p className="text-sm text-muted mb-4">
            Впиши баллы за каждую часть — посчитаем сумму и оценку
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-muted">Тестовая часть</span>
              <input
                type="number"
                min={0}
                max={OGE_MAX_SCORE}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={goal.mockExam.test || ''}
                onChange={(e) => updateMockExam({ test: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Письменная часть</span>
              <input
                type="number"
                min={0}
                max={OGE_MAX_SCORE}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={goal.mockExam.written || ''}
                onChange={(e) => updateMockExam({ written: Number(e.target.value) })}
              />
            </label>
          </div>

          <div
            className={`mt-4 flex items-center justify-between gap-4 rounded-xl p-4 ${
              progress.mockExamMet ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
            }`}
          >
            <div>
              <div className="text-3xl font-bold text-brand-600">
                {mockTotal}
                <span className="text-lg text-muted font-normal"> из {OGE_MAX_SCORE}</span>
              </div>
              <div className="text-sm text-muted mt-1">
                {progress.mockExamMet
                  ? 'Цель достигнута!'
                  : `до цели ${goalMockExamTargets.total}+ не хватает ${goalMockExamTargets.total - mockTotal}`}
              </div>
            </div>
            <GradeBadge grade={currentGrade.grade} />
          </div>
        </Card>
      </div>
    </div>
  )
}

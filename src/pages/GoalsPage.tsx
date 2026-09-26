import type { ReactNode } from 'react'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { MockExamChart } from '../components/MockExamChart'
import { ModuleRadarChart } from '../components/ModuleRadarChart'
import { ProgressRing } from '../components/ProgressRing'
import { useStudent } from '../context/StudentContext'
import {
  GOAL_EXAM_DATE,
  formatGoalTaskList,
  getModuleTopics,
  goalMockExamTargets,
  goalModuleBlocks,
  goalTaskNumbers,
} from '../data/goalPlan'
import {
  getDaysUntilExam,
  getGoalProgress,
  getModuleTopicProgress,
} from '../utils/goalProgress'
import { MASTERY_LEGEND } from '../utils/moduleMastery'

function CheckItem({
  done,
  children,
  detail,
}: {
  done: boolean
  children: ReactNode
  detail?: ReactNode
}) {
  return (
    <li
      className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 ${
        done ? 'border-emerald-200 bg-emerald-50/80' : 'border-border bg-white'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
          done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 bg-white text-transparent'
        }`}
      >
        ✓
      </span>
      <div>
        <span
          className={`text-base leading-snug ${
            done ? 'text-slate-600 line-through decoration-slate-300' : 'text-slate-800'
          }`}
        >
          {children}
        </span>
        {detail && <div className="text-sm text-muted mt-0.5">{detail}</div>}
      </div>
    </li>
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
  const avgMastery = Math.round(
    moduleMastery.reduce((sum, m) => sum + m.value, 0) / moduleMastery.length,
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Моя цель</h1>
        <p className="text-muted mt-2">Отслеживание подготовки к ОГЭ по обществознанию</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="py-4 px-4 bg-gradient-to-br from-brand-50 to-white border-brand-100">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">🎯</span>
              <span className="font-semibold text-slate-900 text-base truncate">
                К {examDateFormatted}
              </span>
            </div>
            {daysUntilExam !== null && (
              <span className="shrink-0 rounded-full bg-white border border-brand-100 px-2.5 py-1 text-sm font-medium text-brand-600">
                {daysUntilExam} дн.
              </span>
            )}
          </div>

          <ul className="space-y-2">
            <CheckItem done={progress.allModulesComplete}>
              Блок-модули — <strong>{progress.topicsDone}/{progress.topicsTotal}</strong> тем
            </CheckItem>
            <CheckItem done={progress.allTasksComplete}>
              Задания №{formatGoalTaskList()} — <strong>{progress.tasksDone}/{progress.tasksTotal}</strong>
            </CheckItem>
            <CheckItem
              done={progress.mockExamMet}
              detail={`${goal.mockExam.test} тест · ${goal.mockExam.written} письмо`}
            >
              Пробник <strong>{goalMockExamTargets.total}+</strong> — {mockTotal} баллов
            </CheckItem>
          </ul>
        </Card>

        <Card className="text-center flex flex-col justify-center py-4">
          <div className="text-4xl mb-1">🎯</div>
          <div className="text-3xl font-bold text-brand-600">{goalMockExamTargets.total}+</div>
          <div className="text-base text-muted mt-1">целевой балл пробника</div>
          <div className="mt-2 text-sm text-muted">
            {goalMockExamTargets.test} тест · {goalMockExamTargets.written} письмо
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 text-lg">Блок-модули: знаю все темы</h2>
          <span className="text-sm text-muted">
            {progress.topicsDone}/{progress.topicsTotal} тем
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 mb-6">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${progress.topicsPercent}%` }}
          />
        </div>

        <div className="space-y-4">
          {goalModuleBlocks.map((block) => {
            const done = getModuleTopicProgress(goal, block.moduleId)
            const complete = done >= block.topicsTotal
            const topics = getModuleTopics(block.moduleId, block.topicsTotal)

            return (
              <div
                key={block.moduleId}
                className={`rounded-xl border p-4 ${
                  complete ? 'border-emerald-200 bg-emerald-50/50' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{block.icon}</span>
                    <span className="font-medium text-slate-900">{block.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-600">
                      {done}/{block.topicsTotal}
                    </span>
                    {complete && <Badge variant="success">Готово</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topicId, index) => {
                    const checked = goal.completedTopics.includes(topicId)
                    return (
                      <button
                        key={topicId}
                        type="button"
                        onClick={() => toggleGoalTopic(topicId)}
                        title={`Тема ${index + 1}`}
                        className={`h-8 min-w-8 rounded-lg text-xs font-medium transition-colors ${
                          checked
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {checked ? '✓' : index + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Задания: решаю уверенно</h2>
            <span className="text-sm text-muted">
              {progress.tasksDone}/{progress.tasksTotal}
            </span>
          </div>
          <p className="text-sm text-muted mb-4">
            Цель — уверенно решать задания №{formatGoalTaskList()}
          </p>
          <div className="flex flex-wrap gap-2">
            {goalTaskNumbers.map((num) => {
              const done = goal.completedTaskNumbers.includes(num)
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => toggleGoalTask(num)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    done
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  №{num} {done && '✓'}
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900 mb-1">Пробный экзамен: 32+ балла</h2>
          <p className="text-sm text-muted mb-4">
            Цель — {goalMockExamTargets.test} баллов тест + {goalMockExamTargets.written} письменная часть
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-muted">Тестовая часть (цель: {goalMockExamTargets.test})</span>
              <input
                type="number"
                min={0}
                max={20}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={goal.mockExam.test || ''}
                onChange={(e) => updateMockExam({ test: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">
                Письменная часть (цель: {goalMockExamTargets.written})
              </span>
              <input
                type="number"
                min={0}
                max={25}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={goal.mockExam.written || ''}
                onChange={(e) => updateMockExam({ written: Number(e.target.value) })}
              />
            </label>
          </div>

          <div
            className={`mt-4 rounded-xl p-4 text-center ${
              progress.mockExamMet ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
            }`}
          >
            <div className="text-3xl font-bold text-brand-600">
              {mockTotal}
              <span className="text-lg text-muted font-normal">
                {' '}/ {goalMockExamTargets.total}+
              </span>
            </div>
            <div className="text-sm text-muted mt-1">
              {goal.mockExam.test} тест + {goal.mockExam.written} письменная
            </div>
            {progress.mockExamMet && (
              <Badge variant="success">
                <span className="mt-2 inline-block">Цель по пробнику достигнута!</span>
              </Badge>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

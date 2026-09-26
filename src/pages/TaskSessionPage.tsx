import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card } from '../components/Card'
import { ModuleArt } from '../components/ModuleArt'
import { EmptyState } from '../components/EmptyState'
import { useStudent } from '../context/StudentContext'
import { OGE_MAX_SCORE, getGrade, mockExamMonths } from '../data/goalPlan'
import type { PracticeTask } from '../types'
import {
  getKindIcon,
  getKindTitle,
  getModuleTitle,
  resolveSession,
  sourceUrl,
  type SessionSpec,
} from '../utils/tasks'

interface TaskState {
  choice?: string
  checked?: boolean
  draft?: string
  revealed?: boolean
  score?: number
}

const EXAM_SECONDS = 3 * 60 * 60

/** Новый набор заданий при каждом изменении параметров адреса. */
export function TaskSessionRoute() {
  const location = useLocation()
  return <TaskSessionPage key={location.search} />
}

export function TaskSessionPage() {
  const location = useLocation()
  const { state } = useStudent()
  // Набор заданий фиксируется при открытии страницы (перемешивание не должно меняться при каждом рендере)
  const [spec] = useState<SessionSpec | null>(() =>
    resolveSession(new URLSearchParams(location.search), state.taskAttempts),
  )

  if (!spec) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <BackLink />
        <EmptyState icon="🤔" title="Набор заданий не найден" description="Вернитесь к списку заданий и выберите раздел." />
      </div>
    )
  }

  if (spec.tasks.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <BackLink />
        <EmptyState
          icon="✨"
          title={spec.slotId === 'errors' ? 'Ошибок нет' : 'Заданий пока нет'}
          description={
            spec.slotId === 'errors'
              ? 'Здесь появятся задания, в которых вы ошиблись. Решайте задания в других режимах.'
              : 'В этом разделе ещё нет заданий.'
          }
        />
      </div>
    )
  }

  return <Session spec={spec} />
}

function BackLink() {
  return (
    <Link to="/practice" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
      ← К заданиям
    </Link>
  )
}

function Session({ spec }: { spec: SessionSpec }) {
  const { recordTaskAttempt, addPracticeRecord } = useStudent()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, TaskState>>({})
  const [finished, setFinished] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS)
  const isExam = spec.mode === 'exam'

  useEffect(() => {
    if (!isExam || finished) return
    const timer = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [isExam, finished])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [index])

  const task = spec.tasks[index]
  const current = answers[task?.id] ?? {}

  const update = (taskId: string, patch: Partial<TaskState>) =>
    setAnswers((prev) => ({ ...prev, [taskId]: { ...prev[taskId], ...patch } }))

  const slotTitle = spec.subtitle ? `${spec.title} · ${spec.subtitle}` : spec.title
  const record = (t: PracticeTask, score: number) =>
    recordTaskAttempt(t.moduleId, score === t.maxScore, spec.slotId, {
      taskId: t.id,
      score,
      maxScore: t.maxScore,
      slotTitle,
      format: t.format,
      kind: t.kind,
    })

  const checkTest = () => {
    if (!current.choice) return
    const correct = current.choice === task.answer
    update(task.id, { checked: true, score: correct ? 1 : 0 })
    record(task, correct ? 1 : 0)
  }

  const gradeWritten = (t: PracticeTask, score: number) => {
    const first = answers[t.id]?.score === undefined
    update(t.id, { score })
    if (first) record(t, score)
  }

  const totals = useMemo(() => {
    let test = 0
    let testMax = 0
    let written = 0
    let writtenMax = 0
    let writtenGraded = 0
    for (const t of spec.tasks) {
      const a = answers[t.id]
      if (t.format === 'test') {
        testMax += 1
        if (isExam ? a?.choice === t.answer : a?.checked && a.choice === t.answer) test += 1
      } else {
        writtenMax += t.maxScore
        if (a?.score !== undefined) {
          written += a.score
          writtenGraded += 1
        }
      }
    }
    return { test, testMax, written, writtenMax, writtenGraded }
  }, [answers, spec.tasks, isExam])

  const finishExam = () => {
    // тестовая часть экзамена проверяется автоматически в момент завершения
    for (const t of spec.tasks) {
      if (t.format !== 'test') continue
      const a = answers[t.id]
      record(t, a?.choice === t.answer ? 1 : 0)
    }
    setFinished(true)
    window.scrollTo({ top: 0 })
  }

  const finishPractice = () => {
    addPracticeRecord({
      slotId: spec.slotId,
      slotTitle: spec.subtitle ? `${spec.title} · ${spec.subtitle}` : spec.title,
      moduleId: spec.moduleId,
      score: totals.test + totals.written,
      maxScore: totals.testMax + totals.writtenMax,
    })
    setFinished(true)
    window.scrollTo({ top: 0 })
  }

  if (finished) {
    return isExam ? (
      <ExamResults spec={spec} answers={answers} totals={totals} onGrade={gradeWritten} />
    ) : (
      <PracticeResults spec={spec} totals={totals} />
    )
  }

  const statusOf = (t: PracticeTask): 'none' | 'done' | 'right' | 'wrong' => {
    const a = answers[t.id]
    if (!a) return 'none'
    if (isExam) return a.choice || a.draft ? 'done' : 'none'
    if (t.format === 'test') return a.checked ? (a.choice === t.answer ? 'right' : 'wrong') : 'none'
    if (a.score === undefined) return a.revealed ? 'done' : 'none'
    return a.score === t.maxScore ? 'right' : 'wrong'
  }

  const isLast = index === spec.tasks.length - 1
  const canGoNext = isExam || (task.format === 'test' ? current.checked : current.score !== undefined)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <BackLink />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{spec.title}</h1>
          {spec.subtitle && <p className="text-muted mt-1">{spec.subtitle}</p>}
        </div>
        {isExam && (
          <div className="rounded-xl bg-slate-900 px-4 py-2 font-mono text-lg font-bold text-white">
            ⏱ {formatTime(secondsLeft)}
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {spec.tasks.map((t, i) => {
          const st = statusOf(t)
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition-colors ${
                i === index
                  ? 'ring-2 ring-brand-500 ring-offset-1'
                  : ''
              } ${
                st === 'right'
                  ? 'bg-emerald-500 text-white'
                  : st === 'wrong'
                    ? 'bg-rose-500 text-white'
                    : st === 'done'
                      ? 'bg-brand-600 text-white'
                      : t.format === 'written'
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={t.format === 'written' ? getKindTitle(t.kind) : 'Тестовое задание'}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      <Card className="p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2.5 text-slate-600">
            <ModuleArt moduleId={task.moduleId} size={22} /> {getModuleTitle(task.moduleId)}
          </span>
          {task.format === 'written' ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
              {getKindIcon(task.kind)} {getKindTitle(task.kind)} · до {task.maxScore} б.
            </span>
          ) : (
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">Тест · 1 балл</span>
          )}
        </div>

        {task.source && (
          <div className="mb-4">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Прочитайте текст</div>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-border bg-slate-50 px-4 py-3 text-[15px] leading-relaxed text-slate-800 whitespace-pre-line">
              {task.source}
            </div>
          </div>
        )}

        {task.image && task.kind !== 'statistics' && (
          <img src={task.image} alt="Иллюстрация к заданию" className="mb-4 w-full max-w-xl rounded-xl border border-border" />
        )}

        <p className="text-lg leading-relaxed text-slate-900 whitespace-pre-line">{task.text}</p>

        {task.image && task.kind === 'statistics' && (
          <img src={task.image} alt="Диаграмма к заданию" className="mt-4 w-full max-w-xl rounded-xl border border-border" />
        )}

        {task.format === 'test' ? (
          <TestOptions
            task={task}
            state={current}
            showResult={!isExam && !!current.checked}
            onChoose={(choice) => !current.checked && update(task.id, { choice })}
          />
        ) : (
          <WrittenAnswer
            task={task}
            state={current}
            showReveal={!isExam}
            onDraft={(draft) => update(task.id, { draft })}
            onReveal={() => update(task.id, { revealed: true })}
            onGrade={(score) => gradeWritten(task, score)}
          />
        )}

        {!isExam && task.format === 'test' && current.checked && (
          <Explanation task={task} correct={current.choice === task.answer} />
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            ← Назад
          </button>

          <div className="flex flex-wrap gap-2">
            {!isExam && task.format === 'test' && !current.checked && (
              <button
                type="button"
                onClick={checkTest}
                disabled={!current.choice}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                Проверить
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold ${
                  canGoNext ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border border-border text-slate-500 hover:bg-slate-50'
                }`}
              >
                {canGoNext ? 'Дальше →' : 'Пропустить →'}
              </button>
            )}
            {isLast && (
              <button
                type="button"
                onClick={isExam ? finishExam : finishPractice}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
              >
                {isExam ? 'Завершить экзамен' : 'Завершить'}
              </button>
            )}
          </div>
        </div>
      </Card>

      {isExam && !isLast && (
        <div className="mt-4 text-center">
          <button type="button" onClick={finishExam} className="text-sm text-muted underline underline-offset-4 hover:text-slate-900">
            Завершить экзамен досрочно
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        Задание из открытого банка ФИПИ ·{' '}
        <a href={sourceUrl(task)} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-700">
          РЕШУ ОГЭ №{task.sourceId}
        </a>
      </p>
    </div>
  )
}

function TestOptions({
  task,
  state,
  showResult,
  onChoose,
}: {
  task: PracticeTask
  state: TaskState
  showResult: boolean
  onChoose: (choice: string) => void
}) {
  return (
    <div className="mt-5 grid gap-2">
      {task.options?.map((option, i) => {
        const value = String(i + 1)
        const selected = state.choice === value
        const isAnswer = task.answer === value
        let style = selected ? 'border-brand-500 bg-brand-50' : 'border-border bg-white hover:border-brand-300 hover:bg-slate-50'
        if (showResult) {
          if (isAnswer) style = 'border-emerald-500 bg-emerald-50'
          else if (selected) style = 'border-rose-400 bg-rose-50'
          else style = 'border-border bg-white opacity-60'
        }
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChoose(value)}
            disabled={showResult}
            className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-base transition-colors disabled:cursor-default ${style}`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {value}
            </span>
            <span className="text-slate-900">{option}</span>
          </button>
        )
      })}
    </div>
  )
}

function Explanation({ task, correct }: { task: PracticeTask; correct: boolean }) {
  return (
    <div className={`page-in mt-5 rounded-2xl px-4 py-3 ${correct ? 'bg-emerald-50' : 'bg-rose-50'}`}>
      <div className={`font-bold ${correct ? 'text-emerald-700' : 'text-rose-700'}`}>
        {correct ? '✓ Верно!' : `✗ Неверно. Правильный ответ: ${task.answer}`}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-700 whitespace-pre-line">{task.solution}</p>
    </div>
  )
}

function WrittenAnswer({
  task,
  state,
  showReveal,
  onDraft,
  onReveal,
  onGrade,
}: {
  task: PracticeTask
  state: TaskState
  showReveal: boolean
  onDraft: (draft: string) => void
  onReveal: () => void
  onGrade: (score: number) => void
}) {
  return (
    <div className="mt-5">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Твой ответ</label>
      <textarea
        value={state.draft ?? ''}
        onChange={(e) => onDraft(e.target.value)}
        rows={5}
        placeholder="Напиши ответ так, как написал бы на экзамене…"
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base leading-relaxed outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
      {showReveal && !state.revealed && (
        <button
          type="button"
          onClick={onReveal}
          className="mt-3 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
        >
          Проверить себя: показать ответ и критерии
        </button>
      )}
      {showReveal && state.revealed && <WrittenCheck task={task} score={state.score} onGrade={onGrade} />}
    </div>
  )
}

function WrittenCheck({ task, score, onGrade }: { task: PracticeTask; score?: number; onGrade: (score: number) => void }) {
  return (
    <div className="page-in mt-4 space-y-4">
      <div className="rounded-xl bg-emerald-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Пример правильного ответа</div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-800 whitespace-pre-line">{task.solution}</p>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Оцени себя по критериям — сколько баллов ты бы получил?
        </div>
        <div className="space-y-2">
          {task.criteria?.map((c) => (
            <button
              key={c.points}
              type="button"
              onClick={() => onGrade(c.points)}
              className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                score === c.points ? 'border-brand-500 bg-brand-50' : 'border-border bg-white hover:border-brand-300'
              }`}
            >
              <span
                className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-1.5 text-sm font-bold ${
                  score === c.points ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {c.points}
              </span>
              <span className="text-slate-700">{c.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface Totals {
  test: number
  testMax: number
  written: number
  writtenMax: number
  writtenGraded: number
}

function PracticeResults({ spec, totals }: { spec: SessionSpec; totals: Totals }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <BackLink />
      <Card className="p-8 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Готово!</h1>
        <p className="text-muted mt-1">
          {spec.title}
          {spec.subtitle ? ` · ${spec.subtitle}` : ''}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 max-w-md mx-auto">
          {totals.testMax > 0 && (
            <div className="rounded-xl bg-brand-50 px-4 py-4">
              <div className="text-3xl font-bold text-brand-600">
                {totals.test}/{totals.testMax}
              </div>
              <div className="text-sm font-medium text-brand-800 mt-1">тестовых верно</div>
            </div>
          )}
          {totals.writtenMax > 0 && (
            <div className="rounded-xl bg-amber-50 px-4 py-4">
              <div className="text-3xl font-bold text-amber-600">
                {totals.written}/{totals.writtenMax}
              </div>
              <div className="text-sm font-medium text-amber-800 mt-1">баллов за письменные</div>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            Решить ещё раз
          </button>
          <Link to="/practice/session?mode=errors" reloadDocument className="rounded-xl border border-border px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            К работе над ошибками
          </Link>
        </div>
      </Card>
    </div>
  )
}

function ExamResults({
  spec,
  answers,
  totals,
  onGrade,
}: {
  spec: SessionSpec
  answers: Record<string, TaskState>
  totals: Totals
  onGrade: (task: PracticeTask, score: number) => void
}) {
  const { updateMonthlyMockExam, updateMockExam } = useStudent()
  const [saved, setSaved] = useState(false)
  const written = spec.tasks.filter((t) => t.format === 'written')
  const total = totals.test + totals.written
  const grade = getGrade(total)
  const allGraded = totals.writtenGraded === written.length
  const monthId = mockExamMonths[(new Date().getMonth() + 4) % 12]?.id

  const save = () => {
    const scores = { test: totals.test, written: totals.written }
    updateMockExam(scores)
    if (monthId) updateMonthlyMockExam(monthId, scores)
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <BackLink />
      <Card className="p-6 sm:p-8 mb-6">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Результат пробного варианта</h1>
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <div>
            <div className="text-5xl font-extrabold text-brand-600">
              {total}
              <span className="text-xl font-semibold text-muted"> из {OGE_MAX_SCORE}</span>
            </div>
            <div className="text-sm text-muted mt-1">
              тест: {totals.test}/{totals.testMax} · письменная: {totals.written}/{totals.writtenMax}
              {!allGraded && ' (оцени письменные ниже)'}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-100 px-5 py-3 text-center">
            <div className="text-xs font-semibold uppercase text-muted">оценка</div>
            <div className="text-4xl font-extrabold text-slate-900">{grade.grade}</div>
          </div>
        </div>
        {monthId && (
          <button
            type="button"
            onClick={save}
            disabled={!allGraded || saved}
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500"
          >
            {saved ? '✓ Сохранено в «Моя цель»' : allGraded ? 'Сохранить как пробник в «Моя цель»' : 'Сначала оцени все письменные задания'}
          </button>
        )}
      </Card>

      <h2 className="mb-3 text-lg font-bold text-slate-900">Письменная часть: оцени себя</h2>
      <div className="space-y-4">
        {written.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="mb-2 text-xs font-semibold text-amber-800">
              {getKindIcon(t.kind)} {getKindTitle(t.kind)} · до {t.maxScore} б.
            </div>
            <p className="font-medium text-slate-900 whitespace-pre-line">{t.text}</p>
            {answers[t.id]?.draft && (
              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-line">
                <span className="font-semibold">Твой ответ: </span>
                {answers[t.id]?.draft}
              </div>
            )}
            <WrittenCheck task={t} score={answers[t.id]?.score} onGrade={(s) => onGrade(t, s)} />
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold text-slate-900">Тестовая часть: разбор</h2>
      <div className="space-y-3">
        {spec.tasks
          .filter((t) => t.format === 'test')
          .map((t) => {
            const choice = answers[t.id]?.choice
            const ok = choice === t.answer
            return (
              <Card key={t.id} className={`p-4 ${ok ? 'border-emerald-200' : 'border-rose-200'}`}>
                <p className="text-sm text-slate-900 whitespace-pre-line">{t.text}</p>
                <div className={`mt-2 text-sm font-semibold ${ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {ok ? '✓ Верно' : `✗ Твой ответ: ${choice ?? '—'} · правильный: ${t.answer} (${t.options?.[Number(t.answer) - 1]})`}
                </div>
                {!ok && <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">{t.solution}</p>}
              </Card>
            )
          })}
      </div>
    </div>
  )
}

function formatTime(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

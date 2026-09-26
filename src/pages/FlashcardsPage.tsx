import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { ModuleArt, ModuleProgress } from '../components/ModuleArt'
import { EmptyState } from '../components/EmptyState'
import { useStudent } from '../context/StudentContext'
import { theoryModules } from '../data/theory'
import type { Flashcard } from '../types'
import {
  ALL_MODULES_ID,
  countStatuses,
  getCardsForModule,
  getModuleTitle,
  pluralCards,
  shuffle,
} from '../utils/flashcards'

type StudyMode = 'cards' | 'test' | 'list'
type FrontSide = 'term' | 'definition'

const studyModes: { id: StudyMode; title: string; icon: string }[] = [
  { id: 'cards', title: 'Карточки', icon: '🃏' },
  { id: 'test', title: 'Тест', icon: '✅' },
  { id: 'list', title: 'Список', icon: '📋' },
]

export function FlashcardsPage() {
  const { moduleId = ALL_MODULES_ID } = useParams()
  const cards = useMemo(() => getCardsForModule(moduleId), [moduleId])
  const { state, resetFlashcards } = useStudent()
  const [mode, setMode] = useState<StudyMode>('cards')

  const stats = countStatuses(cards, state.flashcards)
  const knownPercent = stats.total ? Math.round((stats.known / stats.total) * 100) : 0

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <BackLink />
        <EmptyState icon="🗂️" title="Карточек пока нет" description="Для этого модуля ещё не добавлены понятия." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <BackLink />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {moduleId === ALL_MODULES_ID ? <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-soft">🗂️</span> : <ModuleArt moduleId={moduleId} size={56} />}
          <div>
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{getModuleTitle(moduleId)}</h1>
            <p className="text-muted mt-1">
              {stats.total} {pluralCards(stats.total)} с понятиями
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Знаю: {stats.known}</Badge>
          <Badge variant="warning">Учу: {stats.learning}</Badge>
          <Badge>Новые: {stats.fresh}</Badge>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Выучено</span>
          <span>{knownPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${knownPercent}%` }}
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1.5">
        {studyModes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`flex-1 whitespace-nowrap rounded-xl px-2 py-2.5 text-sm font-semibold transition-all ${
              mode === item.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="mr-1.5">{item.icon}</span>
            {item.title}
          </button>
        ))}
      </div>

      {mode === 'cards' && <CardsMode key={moduleId} cards={cards} />}
      {mode === 'test' && <TestMode key={moduleId} cards={cards} />}
      {mode === 'list' && <ListMode cards={cards} />}

      {(stats.known > 0 || stats.learning > 0) && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Сбросить прогресс по карточкам этого раздела?')) {
                resetFlashcards(cards.map((c) => c.id))
              }
            }}
            className="text-sm text-muted underline underline-offset-4 hover:text-slate-900"
          >
            Сбросить прогресс по карточкам
          </button>
        </div>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/practice"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
    >
      ← К заданиям
    </Link>
  )
}

/* ------------------------------ Карточки ------------------------------ */

function CardsMode({ cards }: { cards: Flashcard[] }) {
  const { state, setFlashcardStatus } = useStudent()
  const [frontSide, setFrontSide] = useState<FrontSide>('term')
  const [onlyUnknown, setOnlyUnknown] = useState(false)
  const [deck, setDeck] = useState<Flashcard[]>(cards)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [session, setSession] = useState({ known: 0, learning: 0 })

  const buildDeck = useCallback(
    (options: { shuffled: boolean; unknownOnly: boolean }) => {
      let next = options.unknownOnly ? cards.filter((c) => state.flashcards[c.id] !== 'known') : cards
      if (options.shuffled) next = shuffle(next)
      setDeck(next)
      setIndex(0)
      setFlipped(false)
      setSession({ known: 0, learning: 0 })
    },
    [cards, state.flashcards],
  )

  const current = deck[index]
  const finished = index >= deck.length

  // ref держит актуальную позицию, чтобы быстрые нажатия клавиш не засчитали одну карточку дважды
  const posRef = useRef({ deck, index })
  useLayoutEffect(() => {
    posRef.current = { deck, index }
  }, [deck, index])

  const answer = useCallback(
    (known: boolean) => {
      const { deck: d, index: i } = posRef.current
      const card = d[i]
      if (!card) return
      posRef.current = { deck: d, index: i + 1 }
      setFlashcardStatus(card.id, known ? 'known' : 'learning')
      setSession((s) => ({ known: s.known + (known ? 1 : 0), learning: s.learning + (known ? 0 : 1) }))
      setFlipped(false)
      setIndex(i + 1)
    },
    [setFlashcardStatus],
  )

  const goBack = useCallback(() => {
    const { deck: d, index: i } = posRef.current
    const prev = Math.max(0, i - 1)
    posRef.current = { deck: d, index: prev }
    setFlipped(false)
    setIndex(prev)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight') {
        answer(true)
      } else if (e.key === 'ArrowLeft') {
        answer(false)
      } else if (e.key === 'Backspace') {
        goBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer, goBack, finished])

  const settings = (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <div className="flex rounded-xl border border-border bg-white p-1 text-sm">
        {(['term', 'definition'] as FrontSide[]).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => {
              setFrontSide(side)
              setFlipped(false)
            }}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              frontSide === side ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {side === 'term' ? 'Сначала термин' : 'Сначала определение'}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => buildDeck({ shuffled: true, unknownOnly: onlyUnknown })}
        className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        🔀 Перемешать
      </button>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <input
          type="checkbox"
          checked={onlyUnknown}
          onChange={(e) => {
            setOnlyUnknown(e.target.checked)
            buildDeck({ shuffled: false, unknownOnly: e.target.checked })
          }}
          className="h-4 w-4 accent-brand-600"
        />
        Только невыученные
      </label>
    </div>
  )

  if (deck.length === 0) {
    return (
      <>
        {settings}
        <EmptyState
          icon="🎉"
          title="Все карточки выучены"
          description="Снимите галочку «Только невыученные», чтобы повторить всё заново."
        />
      </>
    )
  }

  if (finished) {
    return (
      <>
        {settings}
        <Card className="p-8 text-center">
          <div className="text-5xl mb-3">{session.learning === 0 ? '🏆' : '💪'}</div>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Круг пройден!</h2>
          <p className="text-muted mt-2">Вы просмотрели {deck.length} {pluralCards(deck.length)}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="rounded-xl bg-emerald-50 px-4 py-4">
              <div className="text-3xl font-bold text-emerald-600">{session.known}</div>
              <div className="text-sm font-medium text-emerald-800 mt-1">знаю</div>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-4">
              <div className="text-3xl font-bold text-amber-600">{session.learning}</div>
              <div className="text-sm font-medium text-amber-800 mt-1">ещё учу</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {session.learning > 0 && (
              <button
                type="button"
                onClick={() => {
                  const again = shuffle(deck.filter((c) => state.flashcards[c.id] === 'learning'))
                  setDeck(again)
                  setIndex(0)
                  setFlipped(false)
                  setSession({ known: 0, learning: 0 })
                }}
                className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600"
              >
                Повторить «ещё учу» ({session.learning})
              </button>
            )}
            <button
              type="button"
              onClick={() => buildDeck({ shuffled: true, unknownOnly: onlyUnknown })}
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
            >
              Начать заново
            </button>
          </div>
        </Card>
      </>
    )
  }

  const status = state.flashcards[current.id]
  const front = frontSide === 'term' ? current.term : current.definition
  const back = frontSide === 'term' ? current.definition : current.term
  const frontIsTerm = frontSide === 'term'

  return (
    <>
      {settings}

      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>
          {index + 1} / {deck.length}
        </span>
        {status === 'known' && <Badge variant="success">Знаю</Badge>}
        {status === 'learning' && <Badge variant="warning">Ещё учу</Badge>}
      </div>
      <div className="mb-5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${(index / deck.length) * 100}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flip-card block w-full text-left"
        aria-label="Перевернуть карточку"
      >
        <div key={`${current.id}-${index}`} className={`flip-card-inner ${flipped ? 'is-flipped' : ''}`}>
          <CardFace text={front} isTerm={frontIsTerm} label={frontIsTerm ? 'Термин' : 'Определение'} />
          <CardFace text={back} isTerm={!frontIsTerm} label={frontIsTerm ? 'Определение' : 'Термин'} back />
        </div>
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Нажмите на карточку или пробел, чтобы перевернуть · ← ещё учу · → знаю
      </p>

      <div className="mt-6 grid grid-cols-[auto_1fr_1fr] gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={index === 0}
          className="rounded-xl border border-border bg-white px-4 py-3.5 text-base font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Предыдущая карточка"
        >
          ↩
        </button>
        <button
          type="button"
          onClick={() => answer(false)}
          className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3.5 text-base font-bold text-amber-800 hover:bg-amber-100"
        >
          Ещё учу
        </button>
        <button
          type="button"
          onClick={() => answer(true)}
          className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3.5 text-base font-bold text-emerald-800 hover:bg-emerald-100"
        >
          Знаю
        </button>
      </div>
    </>
  )
}

function CardFace({ text, isTerm, label, back = false }: { text: string; isTerm: boolean; label: string; back?: boolean }) {
  return (
    <div
      className={`flip-card-face ${back ? 'flip-card-back bg-brand-50 border-brand-200' : 'bg-white border-border'} rounded-3xl border-2 shadow-sm`}
    >
      <span className="absolute left-5 top-4 text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <div
        className={`w-full text-center whitespace-pre-line ${
          isTerm
            ? 'text-2xl sm:text-3xl font-bold text-slate-900'
            : text.length > 280
              ? 'text-base sm:text-lg text-slate-800 leading-relaxed'
              : 'text-lg sm:text-xl text-slate-800 leading-relaxed'
        }`}
      >
        {text}
      </div>
    </div>
  )
}

/* -------------------------------- Тест -------------------------------- */

const TEST_LENGTH = 10

interface Question {
  card: Flashcard
  options: Flashcard[]
}

function buildQuestions(cards: Flashcard[], statuses: Record<string, string>): Question[] {
  // сначала невыученные, потом остальные
  const ordered = [
    ...shuffle(cards.filter((c) => statuses[c.id] !== 'known')),
    ...shuffle(cards.filter((c) => statuses[c.id] === 'known')),
  ].slice(0, TEST_LENGTH)
  const pool = cards.length >= 4 ? cards : getCardsForModule(ALL_MODULES_ID)
  return shuffle(ordered).map((card) => {
    const distractors = shuffle(pool.filter((c) => c.id !== card.id && c.term !== card.term)).slice(0, 3)
    return { card, options: shuffle([card, ...distractors]) }
  })
}

function TestMode({ cards }: { cards: Flashcard[] }) {
  const { state, setFlashcardStatus } = useStudent()
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(cards, state.flashcards))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [results, setResults] = useState<{ card: Flashcard; correct: boolean }[]>([])

  const restart = () => {
    setQuestions(buildQuestions(cards, state.flashcards))
    setIndex(0)
    setPicked(null)
    setResults([])
  }

  const next = useCallback(() => {
    setPicked(null)
    setIndex((i) => i + 1)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (picked && (e.key === 'Enter' || e.code === 'Space')) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked, next])

  if (index >= questions.length) {
    const correct = results.filter((r) => r.correct).length
    const mistakes = results.filter((r) => !r.correct)
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="text-5xl mb-3">{correct === results.length ? '🏆' : correct >= results.length / 2 ? '👍' : '📚'}</div>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            {correct} из {results.length}
          </h2>
          <p className="text-muted mt-1">правильных ответов</p>
        </div>
        {mistakes.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-slate-900 mb-3">Повторите эти понятия:</h3>
            <div className="space-y-2">
              {mistakes.map(({ card }) => (
                <div key={card.id} className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <div className="font-semibold text-slate-900">{card.term}</div>
                  <div className="text-sm text-slate-700 mt-1 whitespace-pre-line">{card.definition}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={restart}
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            Новый тест
          </button>
        </div>
      </Card>
    )
  }

  const q = questions[index]

  const choose = (option: Flashcard) => {
    if (picked) return
    const correct = option.id === q.card.id
    setPicked(option.id)
    setResults((r) => [...r, { card: q.card, correct }])
    setFlashcardStatus(q.card.id, correct ? 'known' : 'learning')
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>
          Вопрос {index + 1} / {questions.length}
        </span>
        <span>Верно: {results.filter((r) => r.correct).length}</span>
      </div>
      <div className="mb-5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <Card className="p-6 sm:p-8 mb-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Какому понятию соответствует определение?</div>
        <p className="text-lg text-slate-900 leading-relaxed whitespace-pre-line">{q.card.definition}</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((option) => {
          const isCorrect = option.id === q.card.id
          const isPicked = option.id === picked
          let style = 'border-border bg-white hover:border-brand-300 hover:bg-brand-50'
          if (picked) {
            if (isCorrect) style = 'border-emerald-400 bg-emerald-50 text-emerald-900'
            else if (isPicked) style = 'border-rose-400 bg-rose-50 text-rose-900'
            else style = 'border-border bg-white opacity-60'
          }
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option)}
              disabled={!!picked}
              className={`rounded-xl border-2 px-4 py-4 text-left text-base font-semibold text-slate-900 transition-colors disabled:cursor-default ${style}`}
            >
              {option.term}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-5 py-4">
          <span className={`font-semibold ${picked === q.card.id ? 'text-emerald-700' : 'text-rose-700'}`}>
            {picked === q.card.id ? 'Верно!' : `Правильный ответ: ${q.card.term}`}
          </span>
          <button
            type="button"
            onClick={next}
            className="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Дальше →
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------- Список ------------------------------- */

function ListMode({ cards }: { cards: Flashcard[] }) {
  const { state, setFlashcardStatus } = useStudent()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = q
    ? cards.filter((c) => c.term.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q))
    : cards

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по понятиям…"
        className="mb-4 w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
      {filtered.length === 0 && <p className="text-center text-muted py-8">Ничего не найдено</p>}
      <div className="space-y-2">
        {filtered.map((card) => {
          const status = state.flashcards[card.id]
          return (
            <div key={card.id} className="rounded-xl border border-border bg-white px-4 py-3 sm:flex sm:items-start sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900">{card.term}</div>
                <div className="text-sm text-slate-600 mt-1 whitespace-pre-line">{card.definition}</div>
              </div>
              <button
                type="button"
                onClick={() => setFlashcardStatus(card.id, status === 'known' ? 'learning' : 'known')}
                className={`mt-2 sm:mt-0 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  status === 'known'
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : status === 'learning'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'known' ? '✓ Знаю' : status === 'learning' ? 'Учу' : 'Новая'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FlashcardsModuleList() {
  const { state } = useStudent()
  const all = getCardsForModule(ALL_MODULES_ID)
  const allStats = countStatuses(all, state.flashcards)
  const modules = theoryModules
    .map((m) => ({ module: m, cards: getCardsForModule(m.id) }))
    .filter((m) => m.cards.length > 0)

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#fff4ee] via-[#fdf1f4] to-[#f1f0ff] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/60 blur-3xl" />
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-soft">🃏</span>
          <div>
            <h2 className="text-xl font-bold text-ink">Карточки с понятиями</h2>
            <p className="text-sm text-slate-600 mt-1">Переворачивайте карточки и проверяйте себя тестом</p>
          </div>
        </div>
        <Link to={`/practice/cards/${ALL_MODULES_ID}`} className="btn-primary">
          Все {all.length} {pluralCards(all.length)} · выучено {allStats.known}
        </Link>
      </div>
      <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(({ module, cards }) => {
          const stats = countStatuses(cards, state.flashcards)
          const percent = Math.round((stats.known / stats.total) * 100)
          return (
            <Link
              key={module.id}
              to={`/practice/cards/${module.id}`}
              className="rounded-2xl bg-white/85 p-4 shadow-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-center gap-3">
                <ModuleArt moduleId={module.id} size={40} />
                <div className="min-w-0">
                  <div className="font-semibold text-ink leading-tight">{module.title}</div>
                  <div className="text-xs text-muted">
                    {stats.known} из {stats.total} выучено
                  </div>
                </div>
              </div>
              <ModuleProgress moduleId={module.id} value={percent} className="mt-3" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

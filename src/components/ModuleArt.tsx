/**
 * Фирменные иллюстрации модулей: мягкая цветная плитка с линейным рисунком.
 * Цвет у каждого модуля свой — он же используется в прогресс-барах и акцентах.
 */

export interface ModuleTheme {
  /** основной цвет (линии, текст-акцент) */
  accent: string
  /** светлый фон плитки */
  soft: string
  /** второй тон градиента плитки */
  soft2: string
}

export const moduleThemes: Record<string, ModuleTheme> = {
  'human-society': { accent: '#6d5ce8', soft: '#efedff', soft2: '#e2ddff' },
  'spiritual-life': { accent: '#d9577a', soft: '#ffeef2', soft2: '#ffdbe4' },
  economics: { accent: '#16977f', soft: '#e7f7f3', soft2: '#cfeee6' },
  'social-relations': { accent: '#d98a22', soft: '#fff4e3', soft2: '#ffe6c2' },
  politics: { accent: '#2f7fc4', soft: '#e8f3fc', soft2: '#d3e7f8' },
  law: { accent: '#b4553d', soft: '#fcefe9', soft2: '#f7dccf' },
}

const fallback: ModuleTheme = { accent: '#4b56d2', soft: '#eef0ff', soft2: '#e0e4ff' }

export function getModuleTheme(moduleId: string): ModuleTheme {
  return moduleThemes[moduleId] ?? fallback
}

function Glyph({ moduleId, color }: { moduleId: string; color: string }) {
  const s = { stroke: color, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  const dot = { fill: color }
  switch (moduleId) {
    case 'human-society': // люди и связи между ними
      return (
        <g {...s}>
          <circle cx="24" cy="21" r="5.5" />
          <path d="M14 38c1.6-6 5.4-9 10-9s8.4 3 10 9" />
          <circle cx="40" cy="25" r="4.5" opacity="0.55" />
          <path d="M33 40c1.2-4.6 4-7 7-7s5.8 2.4 7 7" opacity="0.55" />
          <path d="M9 46h38" opacity="0.35" />
        </g>
      )
    case 'spiritual-life': // открытая книга и искра
      return (
        <g {...s}>
          <path d="M32 44V20c-4-3-10-4-18-3v24c8-1 14 0 18 3z" />
          <path d="M32 44V20c4-3 10-4 18-3v24c-8-1-14 0-18 3z" opacity="0.55" />
          <path d="M44 7v6M41 10h6" />
        </g>
      )
    case 'economics': // растущие столбики и монета
      return (
        <g {...s}>
          <path d="M12 46V36M22 46V28M32 46V32M42 46V20" strokeWidth="4" />
          <path d="M10 26l10-7 9 5 13-11" opacity="0.55" />
          <path d="M37 13h5v5" opacity="0.55" />
        </g>
      )
    case 'social-relations': // сеть людей / групп
      return (
        <g {...s}>
          <path d="M20 20l12 14M44 20L32 34M20 20h24" opacity="0.5" />
          <circle cx="20" cy="20" r="6" />
          <circle cx="44" cy="20" r="6" />
          <circle cx="32" cy="36" r="6" />
          <circle cx="32" cy="36" r="1.6" {...dot} stroke="none" />
        </g>
      )
    case 'politics': // здание с колоннами
      return (
        <g {...s}>
          <path d="M10 22L32 10l22 12z" />
          <path d="M16 26v14M26 26v14M38 26v14M48 26v14" opacity="0.6" />
          <path d="M10 44h44" />
        </g>
      )
    case 'law': // весы
      return (
        <g {...s}>
          <path d="M32 10v34M22 46h20" />
          <path d="M14 18h36" />
          <path d="M14 18l-6 13h12zM50 18l-6 13h12z" opacity="0.6" />
          <circle cx="32" cy="10" r="2" {...dot} stroke="none" />
        </g>
      )
    default:
      return <circle cx="32" cy="28" r="12" {...s} />
  }
}

/** Плитка-иллюстрация модуля. size — сторона в пикселях. */
export function ModuleArt({ moduleId, size = 56, className = '' }: { moduleId: string; size?: number; className?: string }) {
  const t = getModuleTheme(moduleId)
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[28%] ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${t.soft} 0%, ${t.soft2} 100%)`,
        boxShadow: `inset 0 0 0 1px ${t.accent}1a`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 56" width={size * 0.7} height={size * 0.62}>
        <Glyph moduleId={moduleId} color={t.accent} />
      </svg>
    </span>
  )
}

/** Тонкая полоска прогресса в цвете модуля. */
export function ModuleProgress({ moduleId, value, className = '' }: { moduleId: string; value: number; className?: string }) {
  const t = getModuleTheme(moduleId)
  return (
    <div className={`h-1.5 overflow-hidden rounded-full ${className}`} style={{ background: t.soft2 }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: t.accent }}
      />
    </div>
  )
}

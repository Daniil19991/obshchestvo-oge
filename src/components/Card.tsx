import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
  const base = 'rounded-2xl border border-border bg-white p-5 shadow-sm'
  const interactive = hover ? ' cursor-pointer transition-all hover:border-brand-200 hover:shadow-md' : ''

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base}${interactive} text-left w-full ${className}`}>
        {children}
      </button>
    )
  }

  return <div className={`${base} ${className}`}>{children}</div>
}

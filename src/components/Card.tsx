import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
  const base = 'rounded-[22px] border border-border/80 bg-white p-5 shadow-soft'
  const interactive = hover
    ? ' cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift'
    : ''

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base}${interactive} text-left w-full ${className}`}>
        {children}
      </button>
    )
  }

  return <div className={`${base}${interactive} ${className}`}>{children}</div>
}

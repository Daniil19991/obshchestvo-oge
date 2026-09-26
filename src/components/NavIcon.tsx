export type NavIconName = 'home' | 'book' | 'pen' | 'target' | 'user' | 'users' | 'bell'

const paths: Record<NavIconName, string> = {
  home: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z',
  book: 'M12 7c-2-1.4-4.8-2-8-1.6V18c3.2-.4 6 .2 8 1.6 2-1.4 4.8-2 8-1.6V5.4C16.8 5 14 5.6 12 7zm0 0v12.6',
  pen: 'M5 19l1-4L16 5l3 3L9 18zM14 7l3 3',
  target: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-4h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm-6 8c.6-3 3-4.8 6-4.8s5.4 1.8 6 4.8M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.4c1.7.6 2.8 2.2 3 4.6',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
}

export function NavIcon({ name, size = 18, className = '' }: { name: NavIconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

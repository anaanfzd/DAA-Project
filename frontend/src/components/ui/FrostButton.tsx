import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'outline'
}

export function FrostButton({
  children,
  className = '',
  variant = 'primary',
  ...rest
}: Props) {
  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-40'
  const styles =
    variant === 'primary'
      ? 'bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)] hover:shadow-[0_0_32px_rgba(255,255,255,0.25)]'
      : variant === 'outline'
        ? 'border border-white/20 bg-transparent text-white/90 hover:border-white/40'
        : 'bg-transparent text-white/80 hover:text-white'

  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={`group ${base} ${styles} ${className}`}
      {...rest}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/15 to-transparent opacity-0 blur-md transition-opacity group-hover:opacity-100" />
      {children}
    </motion.button>
  )
}

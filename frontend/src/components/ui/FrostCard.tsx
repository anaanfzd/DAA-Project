import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children: ReactNode
  glow?: boolean
}

export function FrostCard({ children, className = '', glow, ...rest }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -6,
        boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12)',
      }}
      className={`glass group relative overflow-hidden rounded-2xl p-1 ${glow ? 'shadow-[0_0_40px_rgba(255,255,255,0.08)]' : ''} ${className}`}
      {...rest}
    >
      <div className="rounded-[0.9rem] bg-gradient-to-br from-white/[0.07] to-transparent p-[1px]">
        <div className="rounded-[0.85rem] bg-frost-900/40 p-4">{children}</div>
      </div>
    </motion.div>
  )
}

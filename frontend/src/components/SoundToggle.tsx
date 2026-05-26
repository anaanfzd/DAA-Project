import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { useCallback, useState } from 'react'

function playBlip() {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  const ctx = new Ctx()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.value = 880
  g.gain.value = 0.04
  o.connect(g)
  g.connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + 0.06)
}

type Props = { className?: string }

export function SoundToggle({ className = '' }: Props) {
  const [on, setOn] = useState(false)

  const toggle = useCallback(() => {
    setOn((v) => {
      const next = !v
      if (next) playBlip()
      return next
    })
  }, [])

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      onClick={toggle}
      className={`glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/60 ${className}`}
    >
      {on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      Sound: {on ? 'On' : 'Off'}
    </motion.button>
  )
}

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, Shield, AlertTriangle, Key, Terminal, ArrowRight, UserCheck, User, ShieldAlert } from 'lucide-react'
import { useUser, SEEDED_OPERATORS, type OperatorRole } from '../context/UserContext'

export function Auth({ onLogin }: { onLogin: () => void }) {
  const { login, register } = useUser()
  const [isSignUp, setIsSignUp] = useState(false)
  const [portalType, setPortalType] = useState<'operator' | 'customer'>('operator')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<OperatorRole>('courier')
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [handshakes, setHandshakes] = useState<string[]>([])
  
  // Real-time terminal feeds during biometric scan
  const diagnosticLogs = isSignUp ? [
    'SYS: Opening secure registration channel...',
    'NET: Validating cognitive identity hashes...',
    'SEC: Writing new clearance badge mapping...',
    'AURA: Account initialized! Clearance key loaded.'
  ] : [
    'SYS: Mapped orbital routing nodes...',
    'NET: Retinal signature grid identified...',
    'SEC: Core decryption handbook loaded...',
    'AURA: Cognitive key authenticated. Access granted!'
  ]

  useEffect(() => {
    if (!scanning) return
    setHandshakes([])
    let i = 0
    const interval = setInterval(() => {
      if (i < diagnosticLogs.length) {
        setHandshakes(prev => [...prev, diagnosticLogs[i]])
        i++
      } else {
        clearInterval(interval)
      }
    }, 450)
    return () => clearInterval(interval)
  }, [scanning, isSignUp])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setScanning(true)
    setLoading(true)

    // Simulate scanning/handshaking first
    setTimeout(() => {
      if (isSignUp) {
        const registrationRole = portalType === 'customer' ? 'customer' : role
        const result = register(name, email, password, registrationRole)
        setScanning(false)
        setLoading(false)
        if (result.success) {
          onLogin()
        } else {
          setAuthError(result.error || 'Registration failed.')
        }
      } else {
        const success = login(email, password)
        setScanning(false)
        setLoading(false)
        if (success) {
          onLogin()
        } else {
          setAuthError('Cognitive Security Key Verification Failed.')
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance('Access violation. Cognitive key invalid.')
            utterance.volume = 0.4
            utterance.pitch = 0.7
            window.speechSynthesis.speak(utterance)
          }
        }
      }
    }, 2200)
  }

  const handleQuickFill = (profileEmail: string, profilePass: string) => {
    setIsSignUp(false)
    setEmail(profileEmail)
    setPassword(profilePass)
    setAuthError(null)
  }

  return (
    <div className={`grain relative flex min-h-screen items-center justify-center p-4 transition-colors duration-500 ${authError ? 'bg-red-950/20' : 'bg-frost-900'}`}>
      {/* Background grids */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.08),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none" />
      
      {/* Red security flash when access is denied */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.1, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: 1 }}
            className="absolute inset-0 bg-red-600/20 pointer-events-none z-50 border-4 border-red-500/30"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`glass relative z-10 w-full max-w-lg overflow-hidden rounded-3xl p-8 border transition-all duration-300 ${authError ? 'border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.25)]' : 'border-white/10'}`}
      >
        {/* Decorative corner brackets */}
        <div className="absolute top-4 left-4 text-white/20 text-xs font-mono select-none">┌ FR-SEC // 0x48A</div>
        <div className="absolute top-4 right-4 text-white/20 text-xs font-mono select-none">09_NODE_SEC ┐</div>
        <div className="absolute bottom-4 left-4 text-white/20 text-xs font-mono select-none">└ SATELLITE_LINK</div>
        <div className="absolute bottom-4 right-4 text-white/20 text-xs font-mono select-none">PORTAL_VER3.2 ┘</div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 mb-6 font-mono text-xs uppercase tracking-wider justify-around">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false)
              setAuthError(null)
            }}
            className={`pb-2 border-b-2 transition cursor-pointer px-4 ${!isSignUp ? 'border-white text-white font-bold' : 'border-transparent text-white/40 hover:text-white/70'}`}
          >
            [ Decrypt Session ]
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true)
              setAuthError(null)
            }}
            className={`pb-2 border-b-2 transition cursor-pointer px-4 ${isSignUp ? 'border-white text-white font-bold' : 'border-transparent text-white/40 hover:text-white/70'}`}
          >
            [ Sign Up Operator ]
          </button>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 shadow-[0_0_40px_rgba(255,255,255,0.06)] relative overflow-hidden">
            {scanning ? (
              <>
                <Shield className="h-6 w-6 text-emerald-400 animate-pulse z-10" />
                <motion.div
                  initial={{ top: '-100%' }}
                  animate={{ top: '100%' }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)] z-20"
                />
              </>
            ) : authError ? (
              <ShieldAlert className="h-6 w-6 text-red-400 animate-bounce" />
            ) : (
              <Lock className="h-6 w-6 text-white/80" />
            )}
          </div>
          
          <h2 className="text-xl font-light tracking-wide text-white">
            {scanning 
              ? 'Biometric Decryption' 
              : isSignUp 
                ? 'Register Operator Key' 
                : 'Holographic Node Access'}
          </h2>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-frost-300">
            {scanning 
              ? 'Handshaking satellite link...' 
              : isSignUp 
                ? 'Create a cognitive profile to command the deck' 
                : 'Deploy security credentials for command operations'}
          </p>
        </div>

        {/* Portal Access Selector */}
        <div className="mb-5 grid grid-cols-2 gap-2 p-1 glass rounded-2xl border border-white/5 bg-white/[0.01]">
          <button
            type="button"
            onClick={() => {
              setPortalType('operator')
              setRole('courier')
              setAuthError(null)
            }}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer font-mono ${
              portalType === 'operator'
                ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.06)]'
                : 'text-white/40 hover:text-white/70 border border-transparent'
            }`}
          >
            [ Operator / Courier ]
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalType('customer')
              setRole('customer')
              setAuthError(null)
            }}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer font-mono ${
              portalType === 'customer'
                ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.06)]'
                : 'text-white/40 hover:text-white/70 border border-transparent'
            }`}
          >
            [ Customer Terminal ]
          </button>
        </div>

        {/* Quick Profiles Drawer (Only visible on Login/Decrypt tab) */}
        {!isSignUp && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.01] p-3 text-center">
            <p className="text-[9px] uppercase tracking-[0.25em] text-white/40 mb-2 font-mono flex items-center justify-center gap-1">
              <UserCheck className="h-3 w-3 text-emerald-400" /> Active Grid Profiles
            </p>
            <div className={`grid gap-2 ${portalType === 'customer' ? 'grid-cols-1 max-w-[200px] mx-auto' : 'grid-cols-3'}`}>
              {SEEDED_OPERATORS.filter(op =>
                portalType === 'customer' ? op.role === 'customer' : (op.role !== 'customer' && op.role !== 'commander')
              ).map((op) => (
                <button
                  key={op.email}
                  type="button"
                  onClick={() => handleQuickFill(op.email, op.password)}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] tracking-wide transition capitalize text-left cursor-pointer flex flex-col justify-between ${
                    email === op.email && !isSignUp
                      ? op.role === 'admin'
                        ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                        : op.role === 'courier'
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                          : op.role === 'customer'
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                            : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                      : 'border-white/5 bg-white/[0.01] text-white/50 hover:border-white/15 hover:text-white/80'
                  }`}
                >
                  <span className="font-semibold">{op.name}</span>
                  <span className="text-[8px] opacity-60 font-mono mt-0.5">{op.role}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scanning status terminal log */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-5 rounded-xl bg-black/40 p-3 font-mono text-[10px] text-emerald-400/80 border border-emerald-500/20"
            >
              <div className="flex items-center gap-1.5 text-white/30 uppercase border-b border-white/5 pb-1 mb-1 font-bold text-[8px]">
                <Terminal className="h-3.5 w-3.5 animate-spin" /> Security Handshake Diagnostics
              </div>
              <div className="space-y-1">
                {handshakes.map((h, i) => (
                  <div key={i} className="flex gap-1">
                    <span className="text-emerald-500 animate-pulse">✓</span> {h}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert Display */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-200 text-xs animate-pulse"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-bold font-mono">ACCESS VIOLATION REGISTERED</p>
                <p className="text-[10px] opacity-80 mt-0.5">{authError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Operator Callname</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setAuthError(null)
                  }}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/20 transition focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                  placeholder="e.g. Steve Rogers"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Operator ID (Email)</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setAuthError(null)
                }}
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/20 transition focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                placeholder="operator@frostroute.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Cognitive Key Code</label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setAuthError(null)
                }}
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/20 transition focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isSignUp && portalType === 'operator' && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Deck Clearance Role</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(['courier', 'analyst'] as OperatorRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-lg border text-[10px] font-bold uppercase font-mono tracking-wider transition cursor-pointer ${
                      role === r
                        ? r === 'courier'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'border-white/5 bg-white/[0.01] text-white/40 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading || (isSignUp && !name.trim()) || !email.trim() || !password.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer ${
              authError 
                ? 'bg-red-500 text-white hover:bg-red-600'
                : scanning
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white text-frost-900 hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
            }`}
          >
            {scanning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-emerald-400 border-t-transparent"
              />
            ) : (
              <>
                {isSignUp ? 'Register operator identity' : 'Initialize Command Link'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

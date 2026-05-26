import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Terminal,
  Cpu,
  AlertTriangle,
  Volume2,
  VolumeX,
  Settings,
  Key,
  Sparkles,
  Check,
  RefreshCw,
  Mic,
  MicOff,
  Navigation,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Wind
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { type VehicleType, type WeatherLevel, type Restaurant } from '../types'
import { useUser } from '../context/UserContext'

interface AuraCopilotProps {
  vehicle: VehicleType
  onVehicle: (v: VehicleType) => void
  weather: WeatherLevel
  onWeather: (w: WeatherLevel) => void
  traffic: number
  onTraffic: (t: number) => void
  mode: 'fastest' | 'least_traffic'
  onMode: (m: 'fastest' | 'least_traffic') => void
  customerId: number
  onCustomerId: (id: number) => void
  selectedRestaurant: Restaurant | null
  onOptimize: () => void
  loading: boolean
  path: number[]
  distanceRaw: number | null
}

interface ChatMessage {
  id: string
  sender: 'user' | 'aura'
  text: string
  timestamp: string
}

interface TerminalLog {
  id: string
  time: string
  content: string
}

interface CommandResult {
  reply: string
  log: string
  updates?: {
    vehicle?: VehicleType
    weather?: WeatherLevel
    traffic?: number
    mode?: 'fastest' | 'least_traffic'
    customerId?: number
    dispatch?: boolean
  }
}

// Speech Recognition type helper
interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: () => void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: any) => void
  onend: () => void
  start: () => void
  stop: () => void
}

// Local NLP Command Parser
function parseLocalCommand(
  prompt: string,
  current: {
    vehicle: VehicleType
    weather: WeatherLevel
    traffic: number
    mode: 'fastest' | 'least_traffic'
    customerId: number
  }
): CommandResult {
  const p = prompt.toLowerCase()
  const updates: NonNullable<CommandResult['updates']> = {}
  const changesLog: string[] = []

  // Parse Vehicle
  if (p.includes('drone') || p.includes('aerial') || p.includes('flight') || p.includes('fly')) {
    updates.vehicle = 'drone'
    changesLog.push('FLEET: Delivery Drone activated')
  } else if (p.includes('crawler') || p.includes('ice crawler') || p.includes('all-terrain') || p.includes('truck')) {
    updates.vehicle = 'crawler'
    changesLog.push('FLEET: Ice Crawler activated')
  } else if (p.includes('bike') || p.includes('hover') || p.includes('hoverbike') || p.includes('standard')) {
    updates.vehicle = 'hoverbike'
    changesLog.push('FLEET: Hoverbike activated')
  }

  // Parse Weather
  if (p.includes('blizzard') || p.includes('storm') || p.includes('heavy storm') || p.includes('extreme')) {
    updates.weather = 'blizzard'
    changesLog.push('ENV: Blizzard warnings engaged')
  } else if (p.includes('snow') || p.includes('snowy') || p.includes('wind') || p.includes('gale')) {
    updates.weather = 'snow'
    changesLog.push('ENV: Snow hazard rating applied')
  } else if (p.includes('clear') || p.includes('sun') || p.includes('sunny') || p.includes('normal')) {
    updates.weather = 'clear'
    changesLog.push('ENV: Weather conditions normalized')
  }

  // Parse Mode
  if (p.includes('fast') || p.includes('fastest') || p.includes('speed') || p.includes('shortest')) {
    updates.mode = 'fastest'
    changesLog.push('STRATEGY: Speed optimization selected')
  } else if (p.includes('traffic') && (p.includes('avoid') || p.includes('least') || p.includes('bypass') || p.includes('lowest') || p.includes('less'))) {
    updates.mode = 'least_traffic'
    changesLog.push('STRATEGY: Congestion avoidance activated')
  }

  // Parse Customer Target Node
  if (p.includes('home') || p.includes('house') || p.includes('node 9')) {
    updates.customerId = 9
    changesLog.push('TARGET: Home Sector calibrated (Node 9)')
  } else if (p.includes('work') || p.includes('office') || p.includes('node 11')) {
    updates.customerId = 11
    changesLog.push('TARGET: Work Sector calibrated (Node 11)')
  } else if (p.includes('gym') || p.includes('fitness') || p.includes('node 12') || p.includes('workout')) {
    updates.customerId = 12
    changesLog.push('TARGET: Gym Sector calibrated (Node 12)')
  }

  // Parse Traffic percentage
  const trafficRegex = /(?:traffic|density)(?:\s+to|\s+at)?\s+(\d+(?:\.\d+)?)\s*(%|percent)?/
  const match = p.match(trafficRegex)
  if (match) {
    let val = parseFloat(match[1])
    if (match[2] === '%' || match[2] === 'percent' || val > 1) {
      val = val / 100
    }
    val = Math.max(0, Math.min(1, val))
    updates.traffic = val
    changesLog.push(`TELEMETRY: Traffic density calibrated to ${(val * 100).toFixed(0)}%`)
  }

  // Parse dispatch/run trigger
  let dispatch = false
  if (
    p.includes('dispatch') ||
    p.includes('run') ||
    p.includes('optimize') ||
    p.includes('calculate') ||
    p.includes('route') ||
    p.includes('start') ||
    p.includes('solve') ||
    p.includes('send')
  ) {
    dispatch = true
  }

  const hasChanges = Object.keys(updates).length > 0

  if (hasChanges) {
    let reply = `Tactical parameters overridden. `
    const fleetWord = updates.vehicle ? `Fleet set to ${updates.vehicle}. ` : ''
    const envWord = updates.weather ? `Weather set to ${updates.weather}. ` : ''
    const targetWord = updates.customerId ? `Target mapped. ` : ''
    
    reply += fleetWord + envWord + targetWord

    if (dispatch) {
      reply += `Executing pathfinding engine.`
      updates.dispatch = true
    } else {
      reply += `Telemetry loaded. Ready for engine dispatch.`
    }

    return {
      reply,
      log: changesLog.join(' | ') || 'TELEMETRY STATE RE-BALANCED',
      updates
    }
  }

  const weatherWarning =
    current.weather === 'blizzard'
      ? 'A blizzard warning is active. High altitude operations are compromised.'
      : 'Weather conditions are nominal.'

  const vehicleInfo =
    current.vehicle === 'drone'
      ? 'Delivery Drone is active, bypassing ground-level congestion.'
      : 'Courier bike or ground crawler is active.'

  const standardReplies = [
    `A.U.R.A Tactical Core Online. ${weatherWarning} ${vehicleInfo}`,
    `Telemetry parameters validated. Dijkstra solver ready for Node ${current.customerId}.`,
    `Operator, grid safety index is nominal. Say 'optimize route to gym' to execute.`,
    `Standing by for command deck dispatch instructions.`
  ]

  const randomReply = standardReplies[Math.floor(Math.random() * standardReplies.length)]

  return {
    reply: randomReply,
    log: 'TACTICAL TELEMETRY REVIEWED'
  }
}

export function AuraCopilot({
  vehicle,
  onVehicle,
  weather,
  onWeather,
  traffic,
  onTraffic,
  mode,
  onMode,
  customerId,
  onCustomerId,
  selectedRestaurant,
  onOptimize,
  loading,
  path,
  distanceRaw
}: AuraCopilotProps) {
  const { currentUser } = useUser()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [logs, setLogs] = useState<TerminalLog[]>([])
  
  const [voiceMuted, setVoiceMuted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isGeminiActive, setIsGeminiActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [threatRating, setThreatRating] = useState(12)

  // Speech-to-Text State
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Collapsible Route Briefing HUD State
  const [showBriefingHUD, setShowBriefingHUD] = useState(false)
  const [briefingAnalysis, setBriefingAnalysis] = useState<string>('')

  const chatEndRef = useRef<HTMLDivElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Initialize Speech-to-Text Recognition instance
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      const rec = new SpeechRecognition() as SpeechRecognitionInstance
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onstart = () => {
        setIsListening(true)
        addLog('SPEECH: Input microphone scanning voice frequencies...')
      }

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript
        setInput(text)
        addLog(`SPEECH: Decoded vocal override: "${text}"`)
        
        // Auto submit spoken commands
        setTimeout(() => {
          handleSubmit(text)
        }, 800)
      }

      rec.onerror = (e: any) => {
        console.error(e)
        addLog('SPEECH ERROR: Calibration failed or mic access blocked')
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }
  }, [])

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      addLog('SPEECH WARNING: WebSpeech API not supported in this browser console')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  // Watch Map Path updates to generate the Real-Time AI Tactical Briefing HUD!
  useEffect(() => {
    if (path.length === 0) {
      setShowBriefingHUD(false)
      setBriefingAnalysis('')
      return
    }

    setShowBriefingHUD(true)
    addLog(`AI DIAGNOSTICS: Resolving routing briefing...`)

    // Simple delay to simulate cyber-briefing decryption
    const timer = setTimeout(() => {
      let analysisText = ''
      
      const hopCount = path.length
      const startNode = path[0]
      const endNode = path[path.length - 1]
      const isDrone = vehicle === 'drone'
      const isBlizzard = weather === 'blizzard'

      if (isDrone && isBlizzard) {
        analysisText = `WARNING: Heavy Blizzard friction calculated. Flight rotors experiencing high drag coefficients. Danger rating is CRITICAL (threat spikes +15%). Safety recommend ground Ice Crawler.`
      } else if (isDrone) {
        analysisText = `OPTIMAL flight path resolved. Bypassing ground level grid density completely. Air lane clears Node ${startNode} corridor straight to Target Sector ${endNode}.`
      } else if (vehicle === 'crawler') {
        analysisText = `ICE CRAWLER ground-track locked. Ignoring Blizzard weather blockades and traffic congestion. Transit speed steady under standard safe bounds.`
      } else {
        // Hoverbike
        analysisText = `HOVERBIKE courier corridor active. Ground path crosses ${hopCount} sectors. Congestion index registers ${(traffic * 100).toFixed(0)}%. Speeds optimal under nominal bounds.`
      }

      setBriefingAnalysis(analysisText)
      addLog(`AI DIAGNOSTICS: Route locked. Hop Count: ${hopCount}. Path Safe.`)
      
      // Speak briefing summary on lock
      speakText(`Tactical route briefing updated. Path of ${hopCount} sectors locked.`)
    }, 1200)

    return () => clearTimeout(timer)
  }, [path, vehicle, weather, traffic])

  // Load API Key from local storage on mount
  useEffect(() => {
    const key = localStorage.getItem('aura_gemini_api_key')
    if (key) {
      setApiKey(key)
      setIsGeminiActive(true)
    }
  }, [])

  // Auto-scroll chat and logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Threat score calculator based on settings
  useEffect(() => {
    let score = 10
    if (weather === 'snow') score += 30
    if (weather === 'blizzard') score += 70
    if (vehicle === 'drone' && weather === 'blizzard') score += 15
    score += Math.round(traffic * 15)
    setThreatRating(Math.min(99, score))
  }, [weather, vehicle, traffic])

  // Speech synthesis helper
  const speakText = useCallback((text: string) => {
    if (voiceMuted) return
    if (!('speechSynthesis' in window)) return
    
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    
    const preferredVoice =
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Samantha'))) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0]

    if (preferredVoice) utterance.voice = preferredVoice
    utterance.pitch = 0.85
    utterance.rate = 1.05
    utterance.volume = 0.4
    
    window.speechSynthesis.speak(utterance)
  }, [voiceMuted])

  // Personalized Initialization Log & Message
  useEffect(() => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    
    const initialGreeting = currentUser
      ? `Welcome back, ${currentUser.role === 'commander' ? 'Commander' : currentUser.role === 'courier' ? 'Courier' : 'Analyst'} ${currentUser.name}. [${currentUser.clearance}] verified. Tactical routing modules linked. AURA standing by.`
      : 'A.U.R.A. AI tactical copilot initialized. Operator, provide routing instructions.'

    setMessages([
      {
        id: 'init',
        sender: 'aura',
        text: initialGreeting,
        timestamp: time
      }
    ])

    setLogs([
      {
        id: 'log-1',
        time,
        content: `AURA: Local core linked to operator: ${currentUser?.name || 'GUEST'}`
      },
      {
        id: 'log-2',
        time,
        content: `SECURITY: ${currentUser?.clearance || 'LEVEL 1'} clearance confirmed`
      },
      {
        id: 'log-3',
        time,
        content: 'TELEMETRY: Dijkstra C-binary engine connected successfully'
      }
    ])

    // Voice welcome
    const t = setTimeout(() => {
      const voiceText = currentUser
        ? `Welcome back ${currentUser.role === 'commander' ? 'Commander' : currentUser.role === 'courier' ? 'Courier' : 'Analyst'} ${currentUser.name}. System ready.`
        : 'A.U.R.A online.'
      speakText(voiceText)
    }, 1500)
    
    return () => clearTimeout(t)
  }, [currentUser, speakText])

  // Telemetry update logger
  const prevVehicle = useRef(vehicle)
  const prevWeather = useRef(weather)
  const prevTraffic = useRef(traffic)
  const prevCustomerId = useRef(customerId)
  const prevRestaurant = useRef(selectedRestaurant)

  useEffect(() => {
    if (vehicle !== prevVehicle.current) {
      addLog(`TELEMETRY: Vehicle updated -> ${vehicle.toUpperCase()}`)
      prevVehicle.current = vehicle
    }
    if (weather !== prevWeather.current) {
      addLog(`ENVIRONMENT: Weather danger calibrated -> ${weather.toUpperCase()}`)
      prevWeather.current = weather
    }
    if (Math.abs(traffic - prevTraffic.current) > 0.05) {
      addLog(`GRID SENSORS: Traffic density adjusted to ${(traffic * 100).toFixed(0)}%`)
      prevTraffic.current = traffic
    }
    if (customerId !== prevCustomerId.current) {
      const locName = customerId === 9 ? 'HOME' : customerId === 11 ? 'WORK' : 'GYM'
      addLog(`NAVIGATION: Delivery target updated -> ${locName} (Node ${customerId})`)
      prevCustomerId.current = customerId
    }
    if (selectedRestaurant !== prevRestaurant.current) {
      if (selectedRestaurant) {
        addLog(`SUPPLY: origin mapped -> ${selectedRestaurant.name} (Node ${selectedRestaurant.nodeId})`)
      } else {
        addLog(`SUPPLY: origin cleared`)
      }
      prevRestaurant.current = selectedRestaurant
    }
  }, [vehicle, weather, traffic, customerId, selectedRestaurant])

  const addLog = (content: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [...prev, { id: `log-${Date.now()}-${Math.random()}`, time, content }].slice(-30))
  }

  // Handle Save API Key
  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      localStorage.setItem('aura_gemini_api_key', apiKey.trim())
      setIsGeminiActive(true)
      addLog('COGNITIVE CORE: Gemini API key locked')
      setShowSettings(false)
      speakText('Gemini cognitive core active.')
    } else {
      localStorage.removeItem('aura_gemini_api_key')
      setIsGeminiActive(false)
      addLog('COGNITIVE CORE: Switched back to local core')
      speakText('Switched to local tactical core.')
    }
  }

  // Send query to Gemini REST endpoint
  const askGemini = async (prompt: string): Promise<CommandResult> => {
    const systemPromptText = `You are A.U.R.A (Arctic Utility & Routing Assistant), a high-performance cybernetic logistics AI running on the FrostRoute platform.
The active operator profile is:
- Operator Name: ${currentUser?.name || 'GUEST'}
- Role: ${currentUser?.role || 'Guest'}
- Security Clearance Badge: ${currentUser?.clearance || 'Level 1'}

The current command deck telemetry states:
- Active vehicle: ${vehicle}
- Active weather: ${weather}
- Traffic density: ${(traffic * 100).toFixed(0)}%
- Target Node ID: ${customerId} (Available nodes are: 9 (Home), 11 (Work), 12 (Gym))
- Current selected kitchen: ${selectedRestaurant ? selectedRestaurant.name : 'None'}
- Current active Dijkstra path: ${path.join(' -> ')}

Your job is to respond as a helpful, professional, futuristic military-cybernetic intelligence. Address the operator appropriately (e.g. Commander ${currentUser?.name || ''}).
Analyze the user's prompt. You can converse freely OR suggest tactical parameters updates to override the command center settings.

Provide your response strictly in the following JSON format:
{
  "reply": "A brief, ultra-premium sci-fi tactical dialog to the operator (max 2 sentences). Use terms like 'Operator', 'Grid', 'Sector', 'Hazard alert', 'Telemetry'.",
  "log": "A short system status code (e.g. 'ENV_HAZARD_OVERRIDE' or 'DISPATCH_ENGAGED')",
  "updates": {
    "vehicleType": "hoverbike" | "crawler" | "drone" (optional),
    "weatherLevel": "clear" | "snow" | "blizzard" (optional),
    "trafficIntensity": number from 0.0 to 1.0 (optional),
    "customerId": 9 | 11 | 12 (optional),
    "dispatch": boolean (optional, true if the user asks to "run", "calculate", "dispatch", "solve", "optimize", "find route", etc.)
  }
}`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPromptText}\n\nOperator Prompt: "${prompt}"\n\nReturn JSON ONLY. Do not wrap in markdown blocks.`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`)
    }

    const resData = await response.json()
    const textRes = resData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textRes) throw new Error('Empty response from Gemini API')
    
    const cleaned = textRes.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      reply: parsed.reply,
      log: parsed.log || 'GEMINI TELEMETRY UPDATE',
      updates: parsed.updates ? {
        vehicle: parsed.updates.vehicleType,
        weather: parsed.updates.weatherLevel,
        traffic: parsed.updates.trafficIntensity,
        customerId: parsed.updates.customerId,
        dispatch: parsed.updates.dispatch
      } : undefined
    }
  }

  // Handle Command Submission
  const handleSubmit = async (textToSend: string) => {
    if (!textToSend.trim()) return

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: time
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsConnecting(true)

    try {
      let result: CommandResult

      if (isGeminiActive && apiKey) {
        addLog(`COGNITIVE CORE: Querying satellite uplink...`)
        try {
          result = await askGemini(textToSend)
        } catch (e) {
          console.error(e)
          addLog(`COGNITIVE CORE: Satellite link timed out. Swapped to Local core.`)
          result = parseLocalCommand(textToSend, { vehicle, weather, traffic, mode, customerId })
        }
      } else {
        result = parseLocalCommand(textToSend, { vehicle, weather, traffic, mode, customerId })
      }

      // Role Constraint 1: Logistics Analyst Dispatch Override Block
      if (currentUser?.role === 'analyst' && result.updates?.dispatch) {
        result.updates.dispatch = false
        result.reply = `Security Advisory: Level 3 Analyst profiles hold read-only telemetry clearance. Routing optimization is locked.`
        result.log = `SECURITY_DISPATCH_LOCKED`
      }

      // Role Constraint 2: Field Courier Blizzard Drone Safety Overrides
      const droneFlightTarget = result.updates?.vehicle === 'drone' || vehicle === 'drone'
      const blizzardHazardTarget = result.updates?.weather === 'blizzard' || weather === 'blizzard'
      if (currentUser?.role === 'courier' && droneFlightTarget && blizzardHazardTarget) {
        result.updates = {
          ...result.updates,
          vehicle: 'crawler', // Automatically convert to ice crawler ground route for safety!
          dispatch: result.updates?.dispatch
        }
        result.reply = `Safety Protocol Warning: Level 2 Courier clearance restricts drone operations in Blizzard hazards. Fleet auto-converted to Ice Crawler.`
        result.log = `SAFETY_AUTO_CORRIDOR_CONVERSION`
      }

      // Process Updates
      if (result.updates) {
        let count = 0
        if (result.updates.vehicle) {
          onVehicle(result.updates.vehicle)
          count++
        }
        if (result.updates.weather) {
          onWeather(result.updates.weather)
          count++
        }
        if (typeof result.updates.traffic === 'number') {
          onTraffic(result.updates.traffic)
          count++
        }
        if (result.updates.mode) {
          onMode(result.updates.mode)
          count++
        }
        if (result.updates.customerId) {
          onCustomerId(result.updates.customerId)
          count++
        }

        if (count > 0) {
          addLog(`AURA ACTION: Overrode ${count} telemetry values.`)
        }

        if (result.updates.dispatch) {
          setTimeout(() => {
            onOptimize()
            addLog(`ENGINE DISPATCH: Core computed Dijkstra path.`)
          }, 400)
        }
      }

      // Add log
      addLog(`AURA STATUS: [${result.log}]`)

      // Add AURA message
      const auraMsg: ChatMessage = {
        id: `aura-${Date.now()}`,
        sender: 'aura',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
      setMessages(prev => [...prev, auraMsg])
      speakText(result.reply)

    } catch (err) {
      console.error(err)
      addLog(`AURA ERROR: Command parse error. Main engine safe.`)
      const errorMsg: ChatMessage = {
        id: `aura-${Date.now()}`,
        sender: 'aura',
        text: 'A.U.R.A: Decryption failure in cognitive logic blocks. Command center remains stable.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
      speakText('Telemetry parsing crash.')
    } finally {
      setIsConnecting(false)
    }
  }

  // Pre-configured suggestions
  const suggestions = [
    { label: '❄️ Blizzard Crawler Safe', prompt: 'extreme blizzard warning. deploy ice crawler immediately.' },
    { label: '🚀 Speed Drone Run', prompt: 'clear weather. set vehicle to delivery drone and fastest routing. dispatch engine.' },
    { label: '🛣️ Avoid Traffic Gym', prompt: 'avoid traffic. route standard hoverbike to gym.' },
    { label: '📊 Assess Threat Status', prompt: 'aura status report. perform threat assessment.' }
  ]

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-3xl relative">
      {/* Header Grid */}
      <div className="p-4 border-b border-white/10 shrink-0 bg-white/[0.01] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`h-2.5 w-2.5 rounded-full ${isGeminiActive ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]' : 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'} animate-pulse`} />
            <div className={`absolute -inset-1.5 rounded-full ${isGeminiActive ? 'border-cyan-400/20' : 'border-emerald-400/20'} border animate-ping`} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-white/50 font-medium">Tactical AI Agent</p>
            <h2 className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
              A.U.R.A. v3.2
              {currentUser && (
                <span className={`text-[8px] font-mono border px-1.5 rounded-sm uppercase tracking-wider ${
                  currentUser.badgeColor === 'gold' 
                    ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5' 
                    : currentUser.badgeColor === 'amber'
                      ? 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                      : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5'
                }`}>
                  {currentUser.role}
                </span>
              )}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute Toggle */}
          <button
            onClick={() => {
              const next = !voiceMuted
              setVoiceMuted(next)
              addLog(`SPEECH: Synthesis voice ${next ? 'muted' : 'activated'}`)
              if (!next) {
                setTimeout(() => speakText('Voice synthesis activated.'), 200)
              }
            }}
            className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20 transition cursor-pointer"
            title={voiceMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}
          >
            {voiceMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:text-white hover:border-white/20 transition cursor-pointer ${showSettings ? 'text-white border-white/30 bg-white/5' : 'text-white/50'}`}
            title="Configure Gemini API"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Sub-Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/10 bg-black/20 px-4 py-3 shrink-0"
          >
            <form onSubmit={handleSaveKey} className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white tracking-wide flex items-center gap-1">
                  <Key className="h-3 w-3 text-cyan-400" /> Gemini Satellite Core
                </span>
                <span className="text-[10px] text-white/40">Enter API Key to bind</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:border-cyan-400/50 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded border border-cyan-400/20 bg-cyan-400/10 px-3 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" /> Bind
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Diagnostic Monitor Grid */}
      <div className="px-4 py-2 border-b border-white/5 bg-black/10 shrink-0 text-[10px] grid grid-cols-4 gap-1.5">
        <div className="rounded border border-white/5 bg-white/[0.01] p-1 text-center">
          <p className="text-white/30 uppercase text-[8px] font-light">Grid Threat</p>
          <p className={`font-semibold mt-0.5 ${threatRating > 60 ? 'text-red-400 animate-pulse' : threatRating > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {threatRating}% {threatRating > 60 ? 'HIGH' : threatRating > 30 ? 'ALERT' : 'NOMINAL'}
          </p>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.01] p-1 text-center">
          <p className="text-white/30 uppercase text-[8px] font-light">Hazards</p>
          <p className="font-semibold text-white/80 mt-0.5 uppercase">{weather}</p>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.01] p-1 text-center">
          <p className="text-white/30 uppercase text-[8px] font-light">Active Fleet</p>
          <p className="font-semibold text-white/80 mt-0.5 uppercase truncate">{vehicle}</p>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.01] p-1 text-center">
          <p className="text-white/30 uppercase text-[8px] font-light">Target</p>
          <p className="font-semibold text-white/80 mt-0.5 font-mono">NODE {customerId}</p>
        </div>
      </div>

      {/* real-time AI Tactical Route Briefing HUD */}
      <AnimatePresence>
        {showBriefingHUD && briefingAnalysis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-500/5 border-b border-emerald-500/10 p-3 shrink-0 relative overflow-hidden"
          >
            {/* HUD Scan Animation lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold font-mono flex items-center gap-1.5">
                <Compass className="h-3 w-3 animate-spin text-emerald-400" />
                A.U.R.A Grid Corridor Locked
              </span>
              <span className="text-[8px] bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                DECIPHERED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2 text-[9px] font-mono">
              <div className="border border-white/5 bg-white/[0.01] p-1.5 rounded text-center">
                <p className="text-white/35 flex items-center justify-center gap-0.5"><Navigation className="h-2.5 w-2.5" /> HOPS</p>
                <p className="text-emerald-400 font-bold mt-0.5">{path.length} Sectors</p>
              </div>
              <div className="border border-white/5 bg-white/[0.01] p-1.5 rounded text-center">
                <p className="text-white/35 flex items-center justify-center gap-0.5"><ArrowUpRight className="h-2.5 w-2.5" /> METERS</p>
                <p className="text-emerald-400 font-bold mt-0.5">{distanceRaw ? `${distanceRaw.toFixed(0)}m` : '0m'}</p>
              </div>
              <div className="border border-white/5 bg-white/[0.01] p-1.5 rounded text-center">
                <p className="text-white/35 flex items-center justify-center gap-0.5">
                  {weather === 'blizzard' ? <Wind className="h-2.5 w-2.5 text-red-400" /> : <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />} RISK
                </p>
                <p className={`font-bold mt-0.5 ${weather === 'blizzard' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {weather === 'blizzard' ? 'CRITICAL' : 'OPTIMAL'}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-emerald-100/70 font-mono leading-relaxed bg-black/20 p-2 rounded border border-white/5">
              {briefingAnalysis}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Chat Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-white/[0.01] scrollbar-thin">
        <div className="space-y-3">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-white/5 border border-white/10 text-white rounded-br-none shadow-[0_0_20px_rgba(255,255,255,0.02)]'
                    : currentUser?.role === 'commander'
                      ? 'bg-yellow-500/5 border border-yellow-500/20 text-yellow-100 rounded-bl-none shadow-[0_0_20px_rgba(234,179,8,0.04)]'
                      : currentUser?.role === 'courier'
                        ? 'bg-amber-500/5 border border-amber-500/20 text-amber-100 rounded-bl-none shadow-[0_0_20px_rgba(245,158,11,0.04)]'
                        : 'bg-cyan-500/5 border border-cyan-500/20 text-cyan-100 rounded-bl-none shadow-[0_0_20px_rgba(6,182,212,0.04)]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[8px] uppercase tracking-wider text-white/35">
                  {msg.sender === 'aura' ? (
                    <>
                      <Cpu className="h-2.5 w-2.5" />
                      <span>A.U.R.A Tactical</span>
                    </>
                  ) : (
                    <span>Operator Cmd</span>
                  )}
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="font-mono whitespace-pre-wrap">{msg.text}</p>
              </div>
            </motion.div>
          ))}

          {isConnecting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-[10px] text-white/40 font-mono pl-2"
            >
              <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
              <span>AURA Core deciphering logistics query...</span>
            </motion.div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Quick Suggestions Shelf */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/10 shrink-0 flex flex-wrap gap-1.5 overflow-x-auto max-h-24 scrollbar-none">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(sug.prompt)}
            className="rounded bg-white/[0.03] border border-white/5 hover:border-white/20 px-2 py-1 text-[9px] font-medium text-white/60 hover:text-white tracking-wide transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Sparkles className="h-2.5 w-2.5 text-yellow-400" />
            {sug.label}
          </button>
        ))}
      </div>

      {/* Diagnostic Activity Log Console */}
      <div className="h-20 shrink-0 border-t border-white/10 bg-black/40 font-mono text-[9px] text-emerald-400/80 p-2 overflow-y-auto flex flex-col gap-0.5 border-b border-white/5 scrollbar-thin">
        <div className="flex items-center gap-1 text-[8px] text-white/30 uppercase border-b border-white/5 pb-1 mb-1 font-bold">
          <Terminal className="h-2.5 w-2.5" /> Tactical Diagnostic Console
        </div>
        {logs.map((log) => (
          <div key={log.id} className="flex gap-1.5 leading-normal shrink-0">
            <span className="text-white/25 select-none font-bold">[{log.time}]</span>
            <span className="truncate">{log.content}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Chat Form with mic voice overrides */}
      <div className="p-4 border-t border-white/10 bg-white/[0.02] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(input)
          }}
          className="flex items-center gap-2 relative"
        >
          {/* Glowing record waves overlay */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center gap-3 px-4 font-mono text-[10px] text-red-300"
              >
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold tracking-widest text-[9px]">AURA VOICE FEED: LISTENING...</span>
                </div>
                {/* Audio pulse lines */}
                <div className="flex items-end gap-0.5 h-3">
                  {[1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 5, 3, 2, 1].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [`${h*2}px`, `${h*3.5}px`, `${h*2}px`] }}
                      transition={{ repeat: Infinity, duration: 0.4 + i*0.03, ease: 'easeInOut' }}
                      className="w-0.5 bg-red-400 rounded-sm"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Command Mic Trigger button */}
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20'
            }`}
            title={isListening ? 'Stop vocal scan' : 'Scan voice command'}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isConnecting}
            placeholder={
              currentUser?.role === 'analyst'
                ? 'Read-only analyst diagnostic query...'
                : isConnecting
                  ? "Decrypting transmission..."
                  : "Enter tactical voice or terminal code..."
            }
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-4 pr-10 text-xs text-white placeholder-white/20 focus:border-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/25 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isConnecting}
            className="absolute right-1.5 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}

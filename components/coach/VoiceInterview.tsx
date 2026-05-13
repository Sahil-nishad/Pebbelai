'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, MessageSquare, Volume2, VolumeX, Loader2 } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import VoiceOrb from './VoiceOrb'

interface VoiceInterviewProps {
  company: string
  role: string
  sessionType: string
  onClose: () => void
}

type SessionStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error'

export default function VoiceInterview({ company, role, sessionType, onClose }: VoiceInterviewProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [currentSpeech, setCurrentSpeech] = useState('')
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0))

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const isListeningRef = useRef(false)
  const shouldRestartRef = useRef(false)
  const waveformIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Initialize speech synthesis
  useEffect(() => {
    synthRef.current = window.speechSynthesis
    return () => {
      synthRef.current?.cancel()
      recognitionRef.current?.abort()
    }
  }, [])

  // Waveform animation
  useEffect(() => {
    if (sessionStatus === 'listening' || sessionStatus === 'speaking') {
      waveformIntervalRef.current = setInterval(() => {
        setWaveformData(Array(32).fill(0).map(() => Math.random() * 100))
      }, 100)
    } else {
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current)
      setWaveformData(Array(32).fill(0))
    }
    return () => { if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current) }
  }, [sessionStatus])

  // Get the best available voice
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices()
    const preferred = [
      'Google UK English Female', 'Google UK English Male',
      'Microsoft Zira', 'Microsoft David', 'Samantha', 'Karen', 'Daniel',
    ]
    for (const name of preferred) {
      const v = voices.find(voice => voice.name.includes(name))
      if (v) return v
    }
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null
  }, [])

  // Speak text — tries Deepgram TTS first, falls back to browser TTS
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      if (isMuted) { resolve(); return }
      setSessionStatus('speaking')

      // Try Deepgram TTS for natural voice
      try {
        const res = await fetch('/api/coach/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ text: text.slice(0, 800) }),
        })
        if (res.ok && res.headers.get('content-type')?.includes('audio')) {
          const audioBlob = await res.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            setSessionStatus('listening')
            resolve()
            startListening()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            // Fall back to browser TTS
            speakWithBrowser(text, resolve)
          }
          audio.play()
          return
        }
      } catch {}

      // Fallback: browser SpeechSynthesis
      speakWithBrowser(text, resolve)
    })
  }, [isMuted])

  // Browser TTS fallback
  const speakWithBrowser = useCallback((text: string, resolve: () => void) => {
    if (!synthRef.current) { setSessionStatus('listening'); resolve(); startListening(); return }
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = getBestVoice()
    if (voice) utterance.voice = voice
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.onend = () => { setSessionStatus('listening'); resolve(); startListening() }
    utterance.onerror = () => { setSessionStatus('listening'); resolve(); startListening() }
    synthRef.current.speak(utterance)
  }, [getBestVoice])

  // Send message to voice-optimized coach API and speak the response
  const sendToCoach = useCallback(async (userMessage: string) => {
    if (!sessionId || !userMessage.trim()) return
    setTranscript(prev => [...prev, { role: 'You', text: userMessage }])
    setSessionStatus('thinking')
    try {
      const res = await authFetch('/api/coach/voice-message', {
        method: 'POST',
        body: JSON.stringify({ sessionId, message: userMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      const aiMessage = data.message || 'Could you repeat that?'
      setTranscript(prev => [...prev, { role: 'AI Coach', text: aiMessage }])
      await speak(aiMessage)
    } catch {
      toast.error('Failed to get AI response')
      setSessionStatus('listening')
      startListening()
    }
  }, [sessionId, speak])

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return
    try {
      recognitionRef.current.start()
      isListeningRef.current = true
      setSessionStatus('listening')
      setCurrentSpeech('')
    } catch {}
  }, [])

  // Stop speech recognition
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false
    isListeningRef.current = false
    recognitionRef.current?.stop()
  }, [])

  // Initialize session and start voice interview
  const handleStart = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Your browser does not support speech recognition. Use Chrome or Edge.', { duration: 5000 })
      return
    }
    setSessionStatus('connecting')
    try {
      const res = await authFetch('/api/coach/start', {
        method: 'POST',
        body: JSON.stringify({ company, role, sessionType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to start session')
      setSessionId(data.session.id)

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      let finalTranscript = ''

      recognition.onresult = (event: any) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result[0]) {
            if (result.isFinal) { finalTranscript += result[0].transcript + ' ' }
            else { interim = result[0].transcript }
          }
        }
        setCurrentSpeech(finalTranscript + interim)
      }
      recognition.onend = () => {
        isListeningRef.current = false
        if (finalTranscript.trim()) {
          const message = finalTranscript.trim()
          finalTranscript = ''
          setCurrentSpeech('')
          sendToCoach(message)
        } else if (shouldRestartRef.current) { startListening() }
      }
      recognition.onerror = (event: any) => {
        isListeningRef.current = false
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Allow microphone in browser settings.', { duration: 5000 })
          setSessionStatus('error')
        } else if (event.error === 'no-speech' && shouldRestartRef.current) { startListening() }
      }

      recognitionRef.current = recognition
      shouldRestartRef.current = true

      const introMessage = data.introMessage || `Hello! I'm your AI interview coach. Let's practice for your ${sessionType} interview at ${company}. Are you ready?`
      setTranscript([{ role: 'AI Coach', text: introMessage }])
      speechSynthesis.getVoices()
      await new Promise(resolve => setTimeout(resolve, 300))
      await speak(introMessage)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start voice interview')
      setSessionStatus('error')
    }
  }, [company, role, sessionType, speak, sendToCoach, startListening])

  // Stop the session
  const handleStop = useCallback(() => {
    shouldRestartRef.current = false
    stopListening()
    synthRef.current?.cancel()
    setSessionStatus('idle')
  }, [stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      recognitionRef.current?.abort()
      synthRef.current?.cancel()
    }
  }, [])

  const isActive = sessionStatus !== 'idle' && sessionStatus !== 'error' && sessionStatus !== 'connecting'
  const isListening = sessionStatus === 'listening'
  const isSpeaking = sessionStatus === 'speaking'
  const isThinking = sessionStatus === 'thinking'

  const getStatusText = () => {
    if (isListening) return 'Listening...'
    if (isThinking) return 'Processing...'
    if (isSpeaking) return 'Speaking...'
    if (sessionStatus === 'connecting') return 'Connecting...'
    if (sessionStatus === 'error') return 'Error'
    return 'Ready'
  }

  const getStatusColor = () => {
    if (isListening) return 'text-blue-400'
    if (isThinking) return 'text-yellow-400'
    if (isSpeaking) return 'text-green-400'
    return 'text-white/40'
  }

  const headingText = {
    idle: 'Tap the mic to begin your interview.',
    connecting: 'Setting up your AI interviewer...',
    listening: currentSpeech || "I'm listening. Go ahead.",
    thinking: 'Processing your answer...',
    speaking: 'Your AI coach is speaking...',
    error: 'Something went wrong. Try again.',
  }[sessionStatus]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 40%, #091a2e 100%)' }}
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Image src="/pebelai-mark.svg" alt="PebelAI" width={18} height={18} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{company}</h3>
            <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider">AI · {sessionType}</p>
          </div>
        </div>
        <button
          onClick={() => { handleStop(); onClose() }}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Status heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={sessionStatus}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-white text-xl md:text-2xl font-semibold max-w-md mx-auto leading-snug px-4"
            >
              {headingText}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Voice Orb */}
        <motion.div
          className="relative w-72 h-72 md:w-96 md:h-96"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <VoiceOrb
            enableVoiceControl={isListening}
            className="rounded-full overflow-hidden"
            hue={isListening ? 180 : isThinking ? 60 : isSpeaking ? 120 : 0}
          />
          {/* Pulse rings when listening */}
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-500/30"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-500/20"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                />
              </>
            )}
          </AnimatePresence>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isThinking ? (
                <motion.div key="thinking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" />
                </motion.div>
              ) : isSpeaking ? (
                <motion.div key="speaking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Volume2 className="w-16 h-16 text-green-500" />
                </motion.div>
              ) : isListening ? (
                <motion.div key="listening" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Mic className="w-16 h-16 text-blue-500" />
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <MicOff className="w-16 h-16 text-white/30" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Waveform */}
        <div className="flex items-center justify-center space-x-1 h-16">
          {waveformData.map((height, index) => (
            <motion.div
              key={index}
              className={cn(
                'w-1 rounded-full transition-colors duration-300',
                isListening ? 'bg-blue-500' : isThinking ? 'bg-yellow-500' : isSpeaking ? 'bg-green-500' : 'bg-white/10'
              )}
              animate={{
                height: `${Math.max(4, height * 0.6)}px`,
                opacity: isListening || isSpeaking ? 1 : 0.3,
              }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            />
          ))}
        </div>

        {/* Status text */}
        <div className="text-center space-y-2">
          <motion.p
            className={cn('text-lg font-medium transition-colors', getStatusColor())}
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          >
            {getStatusText()}
          </motion.p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {/* Main Mic Button */}
          <div className="flex flex-col items-center gap-2.5">
            <button
              onClick={isActive ? handleStop : handleStart}
              disabled={sessionStatus === 'connecting'}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 border-[3px] disabled:opacity-60 disabled:cursor-wait ${
                isActive
                  ? 'bg-emerald-500/20 border-emerald-400/50 hover:bg-red-500/20 hover:border-red-400/50'
                  : 'bg-white border-white/80 hover:bg-white/90'
              }`}
            >
              {sessionStatus === 'connecting' ? (
                <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
              ) : isActive ? (
                <Mic className="w-8 h-8 text-emerald-400" />
              ) : (
                <MicOff className="w-8 h-8 text-slate-800" />
              )}
            </button>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
              {isActive ? 'Tap to end' : sessionStatus === 'connecting' ? 'Wait...' : 'Tap to start'}
            </span>
          </div>

          {/* Sound toggle */}
          <button onClick={() => { setIsMuted(!isMuted); if (!isMuted) synthRef.current?.cancel() }} className="flex flex-col items-center gap-2 group">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
              isMuted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-white/40 group-hover:text-white/70'
            }`}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </div>
            <span className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Sound</span>
          </button>

          {/* Transcript toggle */}
          <button onClick={() => setShowTranscript(!showTranscript)} className="flex flex-col items-center gap-2 group">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
              showTranscript ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40 group-hover:text-white/70'
            }`}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Transcript</span>
          </button>
        </div>
      </div>

      {/* Transcript Drawer */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="absolute bottom-0 left-0 right-0 h-[45%] bg-[#0d1a2d]/95 backdrop-blur-xl border-t border-white/5 rounded-t-3xl flex flex-col z-20"
          >
            <div className="px-6 pt-5 pb-3 border-b border-white/5 flex items-center justify-between">
              <h4 className="text-white/80 font-bold text-sm flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Live Transcript
              </h4>
              <button onClick={() => setShowTranscript(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {transcript.length === 0 && (
                <div className="h-full flex items-center justify-center text-white/20 text-sm italic">
                  Start the interview to see the transcript here.
                </div>
              )}
              {transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'AI Coach' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'AI Coach' ? 'bg-white/5 text-white/70' : 'bg-emerald-600/80 text-white'
                  }`}>
                    <span className="block text-[9px] opacity-40 mb-1 uppercase font-bold tracking-wider">{msg.role}</span>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex gap-1 pl-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.3s]" />
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="absolute bottom-5 flex items-center gap-2 text-white/20 text-[9px] font-bold uppercase tracking-[0.2em]">
        Powered by Web Speech API + Groq AI
      </div>
    </motion.div>
  )
}

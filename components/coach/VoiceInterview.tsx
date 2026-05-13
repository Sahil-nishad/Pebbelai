'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, MessageSquare, Volume2, VolumeX, Loader2 } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/api'
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
  const [orbIntensity, setOrbIntensity] = useState(0)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const isListeningRef = useRef(false)
  const shouldRestartRef = useRef(false)
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

  // Animate orb intensity based on status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (sessionStatus === 'listening') {
      interval = setInterval(() => setOrbIntensity(Math.random() * 0.4 + 0.1), 150)
    } else if (sessionStatus === 'speaking') {
      interval = setInterval(() => setOrbIntensity(Math.random() * 0.8 + 0.2), 100)
    } else if (sessionStatus === 'thinking') {
      interval = setInterval(() => setOrbIntensity(Math.random() * 0.3), 200)
    } else {
      setOrbIntensity(0)
    }
    return () => clearInterval(interval)
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

  // Speak text using browser TTS
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current || isMuted) {
        resolve()
        return
      }
      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      const voice = getBestVoice()
      if (voice) utterance.voice = voice
      utterance.rate = 1.05
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onend = () => {
        setSessionStatus('listening')
        resolve()
        startListening()
      }
      utterance.onerror = () => {
        setSessionStatus('listening')
        resolve()
        startListening()
      }

      setSessionStatus('speaking')
      synthRef.current.speak(utterance)
    })
  }, [isMuted, getBestVoice])

  // Send message to coach API and speak the response
  const sendToCoach = useCallback(async (userMessage: string) => {
    if (!sessionId || !userMessage.trim()) return

    setTranscript(prev => [...prev, { role: 'You', text: userMessage }])
    setSessionStatus('thinking')

    try {
      const res = await authFetch('/api/coach/message', {
        method: 'POST',
        body: JSON.stringify({ sessionId, message: userMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')

      const aiMessage = data.message || 'I could not generate a response. Please try again.'
      setTranscript(prev => [...prev, { role: 'AI Coach', text: aiMessage }])

      // Clean markdown for speech
      const cleanForSpeech = aiMessage
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^[-•*]\s+/gm, '')
        .replace(/^(Best answer|What worked|Improve|Next step):/gim, '$1: ')
        .trim()

      await speak(cleanForSpeech)
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

      // Set up speech recognition
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
            if (result.isFinal) {
              finalTranscript += result[0].transcript + ' '
            } else {
              interim = result[0].transcript
            }
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
        } else if (shouldRestartRef.current) {
          startListening()
        }
      }

      recognition.onerror = (event: any) => {
        isListeningRef.current = false
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Allow microphone in browser settings.', { duration: 5000 })
          setSessionStatus('error')
        } else if (event.error === 'no-speech' && shouldRestartRef.current) {
          startListening()
        }
      }

      recognitionRef.current = recognition
      shouldRestartRef.current = true

      // Speak the intro message
      const introMessage = data.introMessage || `Hello! I'm your AI interview coach. Let's practice for your ${sessionType} interview at ${company}. Are you ready?`
      setTranscript([{ role: 'AI Coach', text: introMessage }])

      // Load voices
      speechSynthesis.getVoices()
      await new Promise(resolve => setTimeout(resolve, 300))

      const cleanIntro = introMessage.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[-•*]\s+/gm, '').trim()
      await speak(cleanIntro)
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
  const isSpeaking = sessionStatus === 'speaking'
  const isListening = sessionStatus === 'listening'
  const isThinking = sessionStatus === 'thinking'

  // Orb hue: green when listening, blue when speaking, amber when thinking
  const orbHue = isListening ? 150 : isSpeaking ? 220 : isThinking ? 45 : 150

  const statusLabel = {
    idle: 'Ready to start',
    connecting: 'Starting session...',
    listening: 'Listening...',
    thinking: 'AI is thinking...',
    speaking: 'Speaking...',
    error: 'Connection failed',
  }[sessionStatus]

  const headingText = {
    idle: 'Tap the mic to begin your interview.',
    connecting: 'Setting up your AI interviewer...',
    listening: currentSpeech || "I'm listening. Go ahead.",
    thinking: 'Processing your answer...',
    speaking: 'Your AI coach is speaking...',
    error: 'Something went wrong. Please try again.',
  }[sessionStatus]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 40%, #091a2e 100%)' }}
    >
      {/* Subtle background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

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

      {/* Main Content */}
      <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-center gap-6 relative px-6">

        {/* Status */}
        <div className="text-center space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={sessionStatus}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-center gap-2"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${
                isSpeaking ? 'bg-blue-400 animate-pulse' :
                isListening ? 'bg-emerald-400 animate-pulse' :
                isThinking ? 'bg-amber-400 animate-pulse' :
                sessionStatus === 'error' ? 'bg-red-400' : 'bg-white/30'
              }`} />
              <span className="text-white/50 font-medium tracking-widest uppercase text-[10px]">
                {statusLabel}
              </span>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={isListening ? (currentSpeech || 'listening') : sessionStatus}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-white text-xl md:text-2xl font-semibold max-w-md mx-auto leading-snug"
            >
              {headingText}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Voice Orb */}
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          <VoiceOrb
            hue={orbHue}
            isActive={isActive}
            intensity={orbIntensity}
            className="rounded-full overflow-hidden"
          />
          {/* Pulse rings when listening */}
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border border-emerald-500/20"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-emerald-500/10"
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                />
              </>
            )}
          </AnimatePresence>
          {/* Center icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              {isThinking && (
                <motion.div key="thinking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
                    msg.role === 'AI Coach'
                      ? 'bg-white/5 text-white/70'
                      : 'bg-emerald-600/80 text-white'
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
        Powered by Web Speech API + Groq AI — Free & Private
      </div>
    </motion.div>
  )
}

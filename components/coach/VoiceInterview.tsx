'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, MessageSquare, Info, Loader2, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/api'

interface VoiceInterviewProps {
  company: string
  role: string
  sessionType: string
  onClose: () => void
}

type SessionStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'thinking' | 'speaking' | 'error'

// Extend Window for SpeechRecognition types
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number }
  resultIndex: number
}

export default function VoiceInterview({ company, role, sessionType, onClose }: VoiceInterviewProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [currentSpeech, setCurrentSpeech] = useState('')

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isListeningRef = useRef(false)
  const shouldRestartRef = useRef(false)

  // Initialize speech synthesis
  useEffect(() => {
    synthRef.current = window.speechSynthesis
    return () => {
      synthRef.current?.cancel()
      recognitionRef.current?.abort()
    }
  }, [])

  // Get the best available voice
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices()
    // Prefer natural/neural voices
    const preferred = [
      'Google UK English Female',
      'Google UK English Male',
      'Microsoft Zira',
      'Microsoft David',
      'Samantha',
      'Karen',
      'Daniel',
    ]
    for (const name of preferred) {
      const v = voices.find(voice => voice.name.includes(name))
      if (v) return v
    }
    // Fallback: any English voice
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
      utteranceRef.current = utterance

      const voice = getBestVoice()
      if (voice) utterance.voice = voice
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onend = () => {
        setSessionStatus('listening')
        resolve()
        // Restart listening after speaking
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

      // Clean markdown for speech (remove bullets, bold markers, etc.)
      const cleanForSpeech = aiMessage
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^[-•*]\s+/gm, '')
        .replace(/^(Best answer|What worked|Improve|Next step):/gim, '$1: ')
        .trim()

      await speak(cleanForSpeech)
    } catch (err) {
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
    } catch (e) {
      // Already started — ignore
    }
  }, [])

  // Stop speech recognition
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false
    isListeningRef.current = false
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  // Initialize session and start voice interview
  const handleStart = useCallback(async () => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Your browser does not support speech recognition. Please use Chrome or Edge.', { duration: 5000 })
      return
    }

    setSessionStatus('connecting')

    try {
      // Start a coach session via the existing API
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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result[0]) {
            if ((result as any).isFinal) {
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
        // If we have accumulated speech, send it
        if (finalTranscript.trim()) {
          const message = finalTranscript.trim()
          finalTranscript = ''
          setCurrentSpeech('')
          sendToCoach(message)
        } else if (shouldRestartRef.current) {
          // Restart if session is still active
          startListening()
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('[VoiceInterview] Recognition error:', event.error)
        isListeningRef.current = false
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone in browser settings.', { duration: 5000 })
          setSessionStatus('error')
        } else if (event.error === 'no-speech') {
          // No speech detected — restart
          if (shouldRestartRef.current) startListening()
        }
      }

      recognitionRef.current = recognition
      shouldRestartRef.current = true

      // Speak the intro message
      const introMessage = data.introMessage || `Hello! I'm your AI interview coach. Let's practice for your ${sessionType} interview at ${company}. Are you ready?`
      setTranscript([{ role: 'AI Coach', text: introMessage }])
      setSessionStatus('speaking')

      // Load voices (they may not be ready immediately)
      speechSynthesis.getVoices()
      await new Promise(resolve => setTimeout(resolve, 200))

      const cleanIntro = introMessage
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^[-•*]\s+/gm, '')
        .trim()

      await speak(cleanIntro)
    } catch (err: any) {
      console.error('[VoiceInterview] Start error:', err)
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

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        // Muting — stop current speech
        synthRef.current?.cancel()
      }
      return !prev
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      recognitionRef.current?.abort()
      synthRef.current?.cancel()
    }
  }, [])

  const bars = Array.from({ length: 40 })
  const isActive = sessionStatus !== 'idle' && sessionStatus !== 'error' && sessionStatus !== 'connecting'
  const isLoading = sessionStatus === 'connecting' || sessionStatus === 'thinking'
  const isSpeaking = sessionStatus === 'speaking'
  const isListening = sessionStatus === 'listening'

  const statusLabel = {
    idle: 'Ready to start',
    connecting: 'Starting session...',
    connected: 'Connected',
    listening: 'Listening...',
    thinking: 'AI is thinking...',
    speaking: 'AI is speaking...',
    error: 'Connection failed',
  }[sessionStatus]

  const headingText = {
    idle: 'Tap the mic to begin your interview.',
    connecting: 'Setting up your AI interviewer...',
    connected: 'Connected! Starting...',
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
      className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden"
    >
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Image src="/pebelai-mark.svg" alt="PebelAI" width={24} height={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{company}</h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{role} · {sessionType}</p>
          </div>
        </div>
        <button
          onClick={() => { handleStop(); onClose() }}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center gap-12 relative">

        {/* Status */}
        <div className="text-center space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={sessionStatus}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${
                isSpeaking ? 'bg-blue-500 animate-pulse' :
                isListening ? 'bg-emerald-500 animate-pulse' :
                isLoading ? 'bg-amber-500 animate-pulse' :
                sessionStatus === 'error' ? 'bg-red-500' : 'bg-slate-600'
              }`} />
              <span className="text-slate-300 font-medium tracking-wide uppercase text-xs">
                {statusLabel}
              </span>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.h2
              key={isListening ? currentSpeech || 'listening' : sessionStatus}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-white text-2xl md:text-3xl font-semibold max-w-lg mx-auto leading-tight"
            >
              {headingText}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Waveform Visualizer */}
        <div className="relative w-full h-32 flex items-center justify-center gap-1">
          {bars.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: isActive
                  ? [16, Math.random() * (isSpeaking ? 80 : isListening ? 40 : 20) + 16, 16]
                  : 10,
                opacity: isActive ? 1 : 0.25,
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={`w-1.5 rounded-full ${
                isSpeaking ? 'bg-blue-500' :
                isListening ? 'bg-emerald-500' :
                isLoading ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            />
          ))}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl"
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-6">
            {/* Main Mic Button */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={isActive ? handleStop : handleStart}
                disabled={sessionStatus === 'connecting'}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_60px_rgba(0,0,0,0.6)] border-4 disabled:opacity-70 disabled:cursor-wait ${
                  isActive
                    ? 'bg-emerald-600 border-emerald-400/50 scale-110 hover:bg-red-600 hover:border-red-400/50'
                    : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sessionStatus === 'connecting' ? (
                  <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
                ) : isActive ? (
                  <Mic className="w-10 h-10 text-white" />
                ) : (
                  <MicOff className="w-10 h-10 text-slate-900" />
                )}
              </button>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                {isActive ? 'Tap to end' : sessionStatus === 'connecting' ? 'Please wait...' : 'Tap to start'}
              </span>
            </div>

            {/* Mute/Unmute button */}
            <button
              onClick={toggleMute}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                isMuted
                  ? 'bg-red-500/20 border-red-500/30 text-red-400'
                  : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-white'
              }`}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${
                isMuted ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'
              }`}>{isMuted ? 'Muted' : 'Sound'}</span>
            </button>

            {/* Transcript button */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                showTranscript
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-white'
              }`}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${
                showTranscript ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
              }`}>Transcript</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Drawer */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] flex flex-col z-20"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h4 className="text-white font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                Live Transcript
              </h4>
              <button onClick={() => setShowTranscript(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {transcript.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                  Start the interview to see the transcript here.
                </div>
              )}
              {transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'AI Coach' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'AI Coach'
                      ? 'bg-white/5 text-slate-300'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    <span className="block text-[10px] opacity-50 mb-1 uppercase font-bold">{msg.role}</span>
                    {msg.text}
                  </div>
                </div>
              ))}
              {sessionStatus === 'thinking' && (
                <div className="flex gap-1 pl-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
        <Info className="w-3 h-3" />
        Powered by Web Speech API + Groq AI — Free & Private
      </div>
    </motion.div>
  )
}

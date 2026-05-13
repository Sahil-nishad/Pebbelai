'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, MessageSquare, Volume2, VolumeX, Loader2, Phone } from 'lucide-react'
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

// Detect mobile browsers — they need push-to-talk mode
function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export default function VoiceInterview({ company, role, sessionType, onClose }: VoiceInterviewProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [currentSpeech, setCurrentSpeech] = useState('')
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0))
  const [isMobile, setIsMobile] = useState(false)
  const [isPushToTalkHeld, setIsPushToTalkHeld] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const isListeningRef = useRef(false)
  const shouldRestartRef = useRef(false)
  const waveformIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Keep sessionId in a ref so recognition closures always read the latest value
  const sessionIdRef = useRef<string | null>(null)

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Initialize speech synthesis
  useEffect(() => {
    synthRef.current = window.speechSynthesis
    setIsMobile(isMobileBrowser())
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
      if (isMuted || !shouldRestartRef.current) { resolve(); return }
      setSessionStatus('speaking')

      // Try Deepgram TTS for natural voice
      try {
        abortControllerRef.current = new AbortController()
        const res = await fetch('/api/coach/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ text: text.slice(0, 800) }),
          signal: abortControllerRef.current.signal,
        })
        if (res.ok && res.headers.get('content-type')?.includes('audio')) {
          const audioBlob = await res.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audioRef.current = audio
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            audioRef.current = null
            if (shouldRestartRef.current) {
              setSessionStatus('listening')
              resolve()
              // On mobile: longer delay so mic doesn't pick up speaker audio
              const delay = isMobileBrowser() ? 800 : 0
              setTimeout(() => startListening(), delay)
            } else { resolve() }
          }
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            audioRef.current = null
            speakWithBrowser(text, resolve)
          }
          audio.play().catch(() => speakWithBrowser(text, resolve))
          return
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') { resolve(); return }
      }

      // Fallback: browser SpeechSynthesis
      if (shouldRestartRef.current) {
        speakWithBrowser(text, resolve)
      } else { resolve() }
    })
  }, [isMuted])

  // Browser TTS fallback
  const speakWithBrowser = useCallback((text: string, resolve: () => void) => {
    if (!synthRef.current || !shouldRestartRef.current) { resolve(); return }
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = getBestVoice()
    if (voice) utterance.voice = voice
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.onend = () => {
      if (shouldRestartRef.current) {
        setSessionStatus('listening')
        resolve()
        const delay = isMobileBrowser() ? 800 : 0
        setTimeout(() => startListening(), delay)
      } else { resolve() }
    }
    utterance.onerror = () => {
      if (shouldRestartRef.current) {
        setSessionStatus('listening')
        resolve()
        const delay = isMobileBrowser() ? 800 : 0
        setTimeout(() => startListening(), delay)
      } else { resolve() }
    }
    synthRef.current.speak(utterance)
  }, [getBestVoice])

  // Send message to voice-optimized coach API and speak the response
  const sendToCoach = useCallback(async (userMessage: string) => {
    // Use ref — not state — so this always has the latest sessionId even in stale closures
    const currentSessionId = sessionIdRef.current
    if (!currentSessionId || !userMessage.trim()) return
    setTranscript(prev => [...prev, { role: 'You', text: userMessage }])
    setSessionStatus('thinking')
    try {
      const res = await authFetch('/api/coach/voice-message', {
        method: 'POST',
        body: JSON.stringify({ sessionId: currentSessionId, message: userMessage }),
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
  }, [speak])

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return
    if (!shouldRestartRef.current) return
    try {
      isListeningRef.current = true
      setSessionStatus('listening')
      setCurrentSpeech('')
      recognitionRef.current.start()
    } catch (e) {
      // Already started or other error — retry after delay
      isListeningRef.current = false
      if (shouldRestartRef.current) {
        setTimeout(() => startListening(), 500)
      }
    }
  }, [])

  // Push-to-talk: start recording (mobile)
  const handlePushToTalkStart = useCallback(() => {
    if (!shouldRestartRef.current || sessionStatus === 'thinking' || sessionStatus === 'speaking') return
    setIsPushToTalkHeld(true)
    startListening()
  }, [sessionStatus, startListening])

  // Push-to-talk: stop recording and send (mobile)
  const handlePushToTalkEnd = useCallback(() => {
    setIsPushToTalkHeld(false)
    if (isListeningRef.current) {
      try { recognitionRef.current?.stop() } catch {}
      isListeningRef.current = false
    }
  }, [])

  // Stop speech recognition
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false
    isListeningRef.current = false
    try { recognitionRef.current?.stop() } catch {}
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
      sessionIdRef.current = data.session.id  // Update ref immediately — don't wait for re-render

      const recognition = new SpeechRecognition()
      recognition.continuous = false  // Use non-continuous — restarts after each utterance
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      let accumulatedTranscript = ''
      let silenceTimer: ReturnType<typeof setTimeout> | null = null
      let hasSpoken = false
      const mobile = isMobileBrowser()

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result[0]) {
            if (result.isFinal) {
              final += result[0].transcript + ' '
            } else {
              interim = result[0].transcript
            }
          }
        }

        if (final) {
          accumulatedTranscript += final
          hasSpoken = true
        }

        setCurrentSpeech(accumulatedTranscript + interim)

        // On mobile: send immediately on final result (no silence timer — mobile recognition is unreliable)
        if (mobile && final && accumulatedTranscript.trim()) {
          if (silenceTimer) clearTimeout(silenceTimer)
          silenceTimer = setTimeout(() => {
            if (accumulatedTranscript.trim()) {
              const message = accumulatedTranscript.trim()
              accumulatedTranscript = ''
              hasSpoken = false
              setCurrentSpeech('')
              recognition.stop()
              isListeningRef.current = false
              sendToCoach(message)
            }
          }, 1500) // Shorter timeout on mobile
          return
        }

        // Desktop: reset silence timer — user is still talking
        if (silenceTimer) clearTimeout(silenceTimer)
        if (hasSpoken || interim) {
          silenceTimer = setTimeout(() => {
            // User stopped talking for 3.5s — send what we have
            if (accumulatedTranscript.trim()) {
              const message = accumulatedTranscript.trim()
              accumulatedTranscript = ''
              hasSpoken = false
              setCurrentSpeech('')
              recognition.stop()
              isListeningRef.current = false
              sendToCoach(message)
            }
          }, 3500)
        }
      }

      recognition.onend = () => {
        isListeningRef.current = false
        // If we have accumulated text that wasn't sent yet (recognition ended naturally)
        if (accumulatedTranscript.trim()) {
          const message = accumulatedTranscript.trim()
          accumulatedTranscript = ''
          hasSpoken = false
          setCurrentSpeech('')
          if (silenceTimer) clearTimeout(silenceTimer)
          sendToCoach(message)
        } else if (shouldRestartRef.current && sessionStatus !== 'thinking' && sessionStatus !== 'speaking') {
          // On mobile: don't auto-restart — wait for push-to-talk
          // On desktop: restart after a short delay
          if (!mobile) {
            setTimeout(() => startListening(), 300)
          } else {
            // Mobile: go back to idle listening state, user taps to speak
            setSessionStatus('listening')
            setCurrentSpeech('')
          }
        }
      }

      recognition.onerror = (event: any) => {
        isListeningRef.current = false
        if (silenceTimer) clearTimeout(silenceTimer)
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Allow microphone in browser settings.', { duration: 5000 })
          setSessionStatus('error')
        } else if (event.error === 'no-speech') {
          if (!mobile && shouldRestartRef.current) setTimeout(() => startListening(), 300)
          else if (mobile) { setSessionStatus('listening'); setCurrentSpeech('') }
        } else if (event.error === 'aborted') {
          // Aborted — don't restart (likely intentional)
        } else {
          if (!mobile && shouldRestartRef.current) setTimeout(() => startListening(), 500)
          else if (mobile) { setSessionStatus('listening'); setCurrentSpeech('') }
        }
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

  // Stop the session — kills everything immediately
  const handleStop = useCallback(() => {
    shouldRestartRef.current = false
    isListeningRef.current = false
    sessionIdRef.current = null

    // Stop speech recognition
    try { recognitionRef.current?.abort() } catch {}
    try { recognitionRef.current?.stop() } catch {}

    // Stop browser TTS
    synthRef.current?.cancel()

    // Stop Deepgram audio playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }

    // Abort any in-flight fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setSessionStatus('idle')
    setCurrentSpeech('')
  }, [])

  // Cleanup on unmount — stop everything immediately
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      isListeningRef.current = false
      try { recognitionRef.current?.abort() } catch {}
      synthRef.current?.cancel()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
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

  // Use portal to render at document body level, above sidebar and all other UI
  if (typeof document === 'undefined') return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-white overflow-hidden"
    >
      {/* Subtle green tint top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-[#0A6A47]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A6A47]/10 flex items-center justify-center font-black text-[#0A6A47] text-sm">
            {company.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-sm">{company}</h3>
            <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">AI · {sessionType}</p>
          </div>
        </div>
        <button
          onClick={() => { handleStop(); onClose() }}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-6">

        {/* Status heading */}
        <AnimatePresence mode="wait">
          <motion.div
            key={sessionStatus + currentSpeech.slice(0, 20)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center space-y-2"
          >
            {/* Status pill */}
            <div className="flex items-center justify-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isListening ? 'bg-[#0A6A47] animate-pulse' :
                isSpeaking ? 'bg-emerald-500 animate-pulse' :
                isThinking ? 'bg-amber-500 animate-pulse' :
                sessionStatus === 'connecting' ? 'bg-slate-400 animate-pulse' :
                sessionStatus === 'error' ? 'bg-red-500' : 'bg-slate-300'
              }`} />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {getStatusText()}
              </span>
            </div>
            {/* Main heading */}
            <p className="text-slate-900 text-xl md:text-2xl font-semibold max-w-md mx-auto leading-snug">
              {headingText}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Voice Orb */}
        <motion.div
          className="relative w-64 h-64 md:w-80 md:h-80"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <VoiceOrb
            enableVoiceControl={isListening}
            className="rounded-full overflow-hidden"
            hue={isListening ? 150 : isThinking ? 45 : isSpeaking ? 120 : 150}
          />
          {/* Pulse rings when listening */}
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#0A6A47]/25"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.45, opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-[#0A6A47]/15"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.55 }}
                />
              </>
            )}
          </AnimatePresence>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isThinking ? (
                <motion.div key="thinking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Loader2 className="w-14 h-14 text-amber-500 animate-spin" />
                </motion.div>
              ) : isSpeaking ? (
                <motion.div key="speaking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Volume2 className="w-14 h-14 text-[#0A6A47]" />
                </motion.div>
              ) : isListening ? (
                <motion.div key="listening" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Mic className="w-14 h-14 text-[#0A6A47]" />
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <MicOff className="w-14 h-14 text-slate-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Waveform */}
        <div className="flex items-center justify-center gap-0.5 h-12">
          {waveformData.map((height, index) => (
            <motion.div
              key={index}
              className={cn(
                'w-1 rounded-full',
                isListening ? 'bg-[#0A6A47]' :
                isThinking ? 'bg-amber-400' :
                isSpeaking ? 'bg-emerald-500' : 'bg-slate-200'
              )}
              animate={{
                height: `${Math.max(3, height * 0.45)}px`,
                opacity: isListening || isSpeaking ? 1 : 0.4,
              }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-end gap-8">
          {/* Sound toggle */}
          <button
            onClick={() => { setIsMuted(!isMuted); if (!isMuted) synthRef.current?.cancel() }}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
              isMuted
                ? 'bg-red-50 border-red-200 text-red-500'
                : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-[#0A6A47]/30 group-hover:text-[#0A6A47]'
            }`}>
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sound</span>
          </button>

          {/* Main Mic Button — desktop: tap to toggle, mobile: hold to speak */}
          <div className="flex flex-col items-center gap-3">
            {isMobile && isActive ? (
              // Mobile push-to-talk button
              <button
                onTouchStart={e => { e.preventDefault(); handlePushToTalkStart() }}
                onTouchEnd={e => { e.preventDefault(); handlePushToTalkEnd() }}
                onMouseDown={handlePushToTalkStart}
                onMouseUp={handlePushToTalkEnd}
                onMouseLeave={handlePushToTalkEnd}
                disabled={sessionStatus === 'thinking' || sessionStatus === 'speaking'}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-150 shadow-lg select-none ${
                  isPushToTalkHeld
                    ? 'bg-red-500 shadow-red-500/30 scale-110'
                    : sessionStatus === 'thinking' || sessionStatus === 'speaking'
                    ? 'bg-slate-300 shadow-slate-200/50 opacity-60'
                    : 'bg-[#0A6A47] shadow-[#0A6A47]/25 active:scale-95'
                }`}
              >
                {sessionStatus === 'thinking' ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Mic className={`w-8 h-8 text-white ${isPushToTalkHeld ? 'animate-pulse' : ''}`} />
                )}
              </button>
            ) : (
              // Desktop: tap to start/stop
              <button
                onClick={isActive ? handleStop : handleStart}
                disabled={sessionStatus === 'connecting'}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-wait ${
                  isActive
                    ? 'bg-[#0A6A47] hover:bg-[#085c3d] shadow-[#0A6A47]/25'
                    : 'bg-[#0A6A47] hover:bg-[#085c3d] shadow-[#0A6A47]/25'
                }`}
              >
                {sessionStatus === 'connecting' ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : isActive ? (
                  <Mic className="w-8 h-8 text-white" />
                ) : (
                  <MicOff className="w-8 h-8 text-white" />
                )}
              </button>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {!isActive
                ? sessionStatus === 'connecting' ? 'Wait...' : 'Tap to start'
                : isMobile
                ? isPushToTalkHeld ? 'Release to send' : sessionStatus === 'thinking' ? 'Thinking...' : sessionStatus === 'speaking' ? 'AI speaking...' : 'Hold to speak'
                : 'Tap to end'}
            </span>
          </div>

          {/* Transcript toggle */}
          <button onClick={() => setShowTranscript(!showTranscript)} className="flex flex-col items-center gap-2 group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
              showTranscript
                ? 'bg-[#0A6A47]/10 border-[#0A6A47]/30 text-[#0A6A47]'
                : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-[#0A6A47]/30 group-hover:text-[#0A6A47]'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transcript</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-3 flex flex-col items-center gap-1">
        {isMobile && isActive && (
          <p className="text-[11px] font-semibold text-[#0A6A47] bg-[#0A6A47]/10 px-3 py-1 rounded-full">
            Hold the mic button to speak, release to send
          </p>
        )}
        <span className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">
          Powered by Web Speech API + Groq AI
        </span>
      </div>

      {/* Transcript Drawer */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="absolute bottom-0 left-0 right-0 h-[50%] bg-white border-t border-slate-100 rounded-t-3xl flex flex-col z-20 shadow-2xl"
          >
            <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#0A6A47]" />
                Live Transcript
              </h4>
              <button onClick={() => setShowTranscript(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {transcript.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                  Start the interview to see the transcript here.
                </div>
              )}
              {transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'AI Coach' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'AI Coach'
                      ? 'bg-slate-50 border border-slate-100 text-slate-700'
                      : 'bg-[#0A6A47] text-white'
                  }`}>
                    <span className="block text-[9px] opacity-50 mb-1 uppercase font-bold tracking-wider">{msg.role}</span>
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
    </motion.div>,
    document.body
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Volume2, VolumeX, MessageSquare, Info, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useConversation, ConversationProvider } from '@elevenlabs/react'
import toast from 'react-hot-toast'

interface VoiceInterviewProps {
  company: string
  role: string
  sessionType: string
  onClose: () => void
}

type SessionStatus = 'idle' | 'requesting-mic' | 'connecting' | 'connected' | 'error'

function VoiceInterviewContent({ company, role, sessionType, onClose }: VoiceInterviewProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([])
  const contextSentRef = useRef(false)

  const conversation = useConversation({
    onConnect: () => {
      console.log('[VoiceInterview] Connected to ElevenLabs agent')
      setSessionStatus('connected')
      toast.success('Connected to AI Interviewer!')
    },
    onDisconnect: (details) => {
      console.log('[VoiceInterview] Disconnected. Details:', details)
      setSessionStatus('idle')
      if (details?.reason && details.reason !== 'agent') {
        toast.error(`Disconnected: ${details.reason}`)
      }
    },
    onMessage: (message) => {
      // Handle both old and new message formats
      const msg = message as unknown as Record<string, unknown>
      const text = (msg.message || msg.text || msg.content || '') as string
      const source = (msg.source || msg.role || 'ai') as string
      if (text) {
        setTranscript(prev => [...prev, {
          role: source === 'user' ? 'You' : 'AI Coach',
          text
        }])
      }
    },
    onError: (error) => {
      console.error('[VoiceInterview] Error:', error)
      setSessionStatus('error')
      toast.error('Connection error. Please try again.')
    },
  })

  const { isSpeaking } = conversation

  const handleStartClick = useCallback(async () => {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
    if (!agentId) {
      toast.error('ElevenLabs Agent ID not configured. Add NEXT_PUBLIC_ELEVENLABS_AGENT_ID to your environment.')
      return
    }

    setSessionStatus('connecting')

    try {
      // Do NOT call getUserMedia here — let the ElevenLabs SDK handle mic access
      // internally. Calling it ourselves can lock the mic and cause track publishing failures.
      // Use websocket connectionType to avoid WebRTC track publishing issues
      await conversation.startSession({
        agentId,
        connectionType: 'websocket',
        dynamicVariables: {
          company_name: company,
          role_title: role || 'General',
          interview_type: sessionType,
        },
      })
      // Connection success is handled by onConnect callback
    } catch (err: any) {
      console.error('[VoiceInterview] Error starting session:', err)
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied') || err?.message?.includes('not allowed')) {
        toast.error('Microphone blocked. Click the lock icon 🔒 in the address bar and allow microphone.', { duration: 6000 })
      } else {
        toast.error('Could not connect: ' + (err?.message || 'Unknown error'))
      }
      setSessionStatus('error')
    }
  }, [conversation])

  const handleStop = useCallback(async () => {
    await conversation.endSession()
    setSessionStatus('idle')
  }, [conversation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      conversation.endSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bars = Array.from({ length: 40 })
  const isActive = sessionStatus === 'connected'
  const isLoading = sessionStatus === 'connecting' || sessionStatus === 'requesting-mic'

  const statusLabel = {
    idle: 'Ready to start',
    'requesting-mic': 'Waiting for mic permission...',
    connecting: 'Connecting to AI Coach...',
    connected: isSpeaking ? 'Speaking' : 'Listening',
    error: 'Connection failed',
  }[sessionStatus]

  const headingText = {
    idle: 'Tap the mic to begin your interview.',
    'requesting-mic': 'Allow microphone access in the popup.',
    connecting: 'Waking up your AI Interviewer...',
    connected: isSpeaking ? 'Your AI is speaking...' : "I'm listening. Go ahead.",
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
          onClick={onClose}
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
                isActive ? (isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 animate-pulse') :
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
              key={headingText}
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
                  ? [16, Math.random() * (isSpeaking ? 80 : 40) + 16, 16]
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
                isActive ? 'bg-emerald-500' : 'bg-slate-700'
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
                onClick={isActive ? handleStop : handleStartClick}
                disabled={isLoading}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_60px_rgba(0,0,0,0.6)] border-4 disabled:opacity-70 disabled:cursor-wait ${
                  isActive
                    ? 'bg-emerald-600 border-emerald-400/50 scale-110 hover:bg-red-600 hover:border-red-400/50'
                    : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
                ) : isActive ? (
                  <Mic className="w-10 h-10 text-white" />
                ) : (
                  <MicOff className="w-10 h-10 text-slate-900" />
                )}
              </button>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                {isActive ? 'Tap to end' : isLoading ? 'Please wait...' : 'Tap to start'}
              </span>
            </div>

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
              {isSpeaking && (
                <div className="flex gap-1 pl-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
        <Info className="w-3 h-3" />
        AI is evaluating your tone, pacing, and content
      </div>
    </motion.div>
  )
}

export default function VoiceInterview(props: VoiceInterviewProps) {
  return (
    <ConversationProvider>
      <VoiceInterviewContent {...props} />
    </ConversationProvider>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Volume2, VolumeX, History, MessageSquare, Info, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useConversation } from '@elevenlabs/react'
import toast from 'react-hot-toast'

interface VoiceInterviewProps {
  company: string
  role: string
  sessionType: string
  onClose: () => void
}

export default function VoiceInterview({ company, role, sessionType, onClose }: VoiceInterviewProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [muted, setMuted] = useState(false)
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([])

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs')
      toast.success('Connected to Voice Agent')
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs')
    },
    onMessage: (message) => {
      console.log('Message received:', message)
      setTranscript(prev => [...prev, { role: message.source === 'user' ? 'User' : 'Assistant', text: message.message }])
    },
    onError: (error) => {
      console.error('ElevenLabs Error:', error)
      toast.error('Voice service error. Please check your Agent ID.')
    },
  })

  const { status, isSpeaking } = conversation

  const startInterview = useCallback(async () => {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
    if (!agentId || agentId === 'your_agent_id_here') {
      toast.error('ElevenLabs Agent ID not configured in .env.local')
      return
    }

    try {
      // Request microphone permission early
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      await conversation.startSession({
        agentId: agentId,
        // Optional: dynamic variables to give the agent context
        dynamicVariables: {
          company_name: company,
          role_title: role,
          interview_type: sessionType,
        }
      })
    } catch (err) {
      console.error('Failed to start conversation:', err)
      toast.error('Failed to access microphone or connect to voice service')
    }
  }, [conversation, company, role, sessionType])

  useEffect(() => {
    startInterview()
    return () => {
      conversation.endSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Waveform animation
  const bars = Array.from({ length: 40 })

  const isThinking = status === 'connecting'
  const isListening = status === 'connected' && !isSpeaking

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
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMuted(!muted)}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={onClose}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center gap-12 relative">
        
        {/* Status Text */}
        <div className="text-center space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${
                status === 'connected' ? (isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 animate-pulse') : 
                status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'
              }`} />
              <span className="text-slate-300 font-medium tracking-wide uppercase text-xs">
                {status === 'connected' ? (isSpeaking ? 'Speaking' : 'Listening') : 
                 status === 'connecting' ? 'Connecting' : 'Disconnected'}
              </span>
            </motion.div>
          </AnimatePresence>
          <h2 className="text-white text-2xl md:text-3xl font-semibold max-w-lg mx-auto leading-tight">
            {isSpeaking ? "Analyzing your role-specific goals..." : 
             status === 'connected' ? "I'm listening, go ahead." : 
             status === 'connecting' ? "Waking up the AI Coach..." : "Ready to start?"}
          </h2>
        </div>

        {/* Voice Visualizer */}
        <div className="relative w-full h-32 flex items-center justify-center gap-1">
          {bars.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: status === 'connected' 
                  ? [20, Math.random() * (isSpeaking ? 80 : 40) + 20, 20] 
                  : 12,
                opacity: status === 'connected' ? 1 : 0.3
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`w-1.5 rounded-full ${isSpeaking ? 'bg-blue-500' : status === 'connected' ? 'bg-emerald-500' : 'bg-slate-700'}`}
            />
          ))}
          
          {/* Central Orb */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: status === 'connecting' ? [1, 1.2, 1] : 1,
                opacity: status === 'connecting' ? [0.3, 0.6, 0.3] : 0
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
              <History className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 group-hover:text-slate-300">Tips</span>
          </button>

          <button 
            onClick={() => status === 'connected' ? conversation.endSession() : startInterview()}
            disabled={status === 'connecting'}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 ${
              status === 'connected' 
                ? 'bg-emerald-600 border-emerald-400/50 scale-110' 
                : 'bg-white border-slate-200'
            }`}
          >
            {status === 'connecting' ? (
              <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
            ) : status === 'connected' ? (
              <Mic className="w-10 h-10 text-white" />
            ) : (
              <MicOff className="w-10 h-10 text-slate-900" />
            )}
          </button>

          <button 
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              showTranscript 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-white'
            } border`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${showTranscript ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>Chat</span>
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
                  No messages yet. Start speaking to see the transcript.
                </div>
              )}
              {transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'Assistant' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'Assistant' 
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
                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" />
                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="absolute bottom-6 flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
        <Info className="w-3 h-3" />
        AI is evaluating your tone, pacing, and content
      </div>
    </motion.div>
  )
}

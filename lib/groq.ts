import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Model config ──────────────────────────────────────────────────────────────
// Groq fallback model
export const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
// Gemini model
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// ── Groq client ───────────────────────────────────────────────────────────────
let groqClient: Groq | null = null

export function hasGroqKey() {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key')
}

export function getGroqClient() {
  if (!hasGroqKey()) throw new Error('GROQ_API_KEY is missing.')
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return groqClient
}

// ── Gemini client ─────────────────────────────────────────────────────────────
export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10)
}

export function getGeminiClient() {
  if (!hasGeminiKey()) throw new Error('GEMINI_API_KEY is missing.')
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
}

// ── Unified chat completion ───────────────────────────────────────────────────
// Prefers Gemini if configured, falls back to Groq.
// Messages format: OpenAI-style { role: 'system'|'user'|'assistant', content: string }[]
export async function chatCompletion(
  messages: { role: string; content: string }[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const { temperature = 0.4, maxTokens } = options

  // ── Try Gemini first ──────────────────────────────────────────────────────
  if (hasGeminiKey()) {
    try {
      const genAI = getGeminiClient()
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          temperature,
          ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
        },
      })

      // Convert OpenAI-style messages to Gemini format
      const systemMsg = messages.find(m => m.role === 'system')
      const chatMessages = messages.filter(m => m.role !== 'system')

      const history = chatMessages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      const lastMessage = chatMessages[chatMessages.length - 1]
      const userInput = lastMessage?.content || ''

      const chat = model.startChat({
        history,
        ...(systemMsg ? { systemInstruction: systemMsg.content } : {}),
      })

      const result = await chat.sendMessage(userInput)
      return result.response.text()
    } catch (err) {
      console.error('[Gemini] Error, falling back to Groq:', err)
      // Fall through to Groq
    }
  }

  // ── Fall back to Groq ─────────────────────────────────────────────────────
  if (!hasGroqKey()) throw new Error('No AI service configured. Add GEMINI_API_KEY or GROQ_API_KEY.')
  const groq = getGroqClient()
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    })),
    temperature,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
  })
  return response.choices[0].message.content || ''
}

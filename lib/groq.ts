import Groq from 'groq-sdk'

export const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

let groqClient: Groq | null = null

export function hasGroqKey() {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key')
}

export function getGroqClient() {
  if (!hasGroqKey()) {
    throw new Error('GROQ_API_KEY is missing.')
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  }

  return groqClient
}

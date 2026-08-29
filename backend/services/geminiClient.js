import { GoogleGenAI } from '@google/genai'

export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'
export const DEFAULT_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash'

let genAI = null

export function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables')
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return genAI
}

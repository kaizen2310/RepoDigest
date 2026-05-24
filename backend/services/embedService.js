import { GoogleGenAI } from '@google/genai'

const EMBEDDING_MODEL = 'gemini-embedding-001'
const BATCH_SIZE = 3
const DELAY_MS = 3000
let genAI

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return genAI
}

export async function embedText(text) {
  const result = await getGenAI().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  })
  const values = result.embeddings?.[0]?.values
  if (!values) throw new Error('Gemini embedding response did not include values')
  return values
}


export async function embedChunks(chunks) {
  const embedded = []

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)

    try {
      const results = await Promise.all(
        batch.map(async (chunk) => {
          const embedding = await embedText(chunk.text)
          return { ...chunk, embedding }
        })
      )
      embedded.push(...results)
      console.log(`Embedded ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`)
    } catch (err) {
      console.error(`Batch ${i}-${i + BATCH_SIZE} failed:`, err.message)
      throw err
    }

    if (i + BATCH_SIZE < chunks.length) {
      await sleep(DELAY_MS)
    }
  }

  return embedded
}
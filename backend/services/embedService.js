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

async function embedText(text) {
  const result = await getGenAI().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  })
  const values = result.embeddings?.[0]?.values
  if (!values) throw new Error('Gemini embedding response did not include values')
  return values
}

//expoenetial backoff if fails tries with exponential increment wait time
async function embedWithRetry(text, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await embedText(text)
    } catch (err) {
      if (attempt === retries - 1) throw err
      const wait = 1000 * Math.pow(2, attempt)
      console.warn(`Embed failed (attempt ${attempt + 1}), retrying in ${wait}ms...`)
      await sleep(wait)
    }
  }
}

export async function embedChunks(chunks) {
  const embedded = []

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)

    try {
      const results = await Promise.all(
        batch.map(async (chunk) => {
          const embedding = await embedWithRetry(chunk.text)
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
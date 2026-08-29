import { getGenAI, EMBEDDING_MODEL } from './geminiClient.js'

const BATCH_SIZE = 25
const DELAY_BETWEEN_BATCHES_MS = 250

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Embeds a batch of texts in a single Google Gemini API call.
 * Uses RETRIEVAL_DOCUMENT task type for document chunks.
 */
async function embedBatchWithRetry(texts, retries = 3) {
  const ai = getGenAI()

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: {
          taskType: 'RETRIEVAL_DOCUMENT',
        },
      })

      const embeddings = response.embeddings
      if (!embeddings || embeddings.length === 0) {
        throw new Error('Gemini embedding response did not include embeddings')
      }

      return embeddings.map((e) => {
        if (!e?.values) {
          throw new Error('Embedding item missing values array')
        }
        return e.values
      })
    } catch (err) {
      const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota')
      const isLastAttempt = attempt === retries - 1

      if (isLastAttempt) {
        throw err
      }

      const wait = (isRateLimit ? 3000 : 1000) * Math.pow(2, attempt)
      console.warn(
        `[embedService] Batch embedding failed (attempt ${attempt + 1}/${retries}): ${err.message}. Retrying in ${wait}ms...`
      )
      await sleep(wait)
    }
  }
}

/**
 * Embeds an array of chunks in multi-text batches with fallback splitting.
 * @param {Array<{ text: string, [key: string]: any }>} chunks
 * @returns {Promise<Array<{ text: string, embedding: number[], [key: string]: any }>>}
 */
export async function embedChunks(chunks) {
  if (!chunks || chunks.length === 0) return []

  const embedded = []
  console.log(`[embedService] Embedding ${chunks.length} chunks in batches of up to ${BATCH_SIZE}...`)

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const texts = batch.map((c) => c.text)

    try {
      const vectors = await embedBatchWithRetry(texts)
      for (let j = 0; j < batch.length; j++) {
        embedded.push({
          ...batch[j],
          embedding: vectors[j],
        })
      }
      console.log(`[embedService] Embedded ${embedded.length}/${chunks.length} chunks (1 API call)`)
    } catch (batchErr) {
      console.warn(
        `[embedService] Batch of ${batch.length} chunks failed (${batchErr.message}). Falling back to sub-batches...`
      )

      // Fallback: process sub-batches of 5 chunks
      const SUB_BATCH_SIZE = 5
      for (let k = 0; k < batch.length; k += SUB_BATCH_SIZE) {
        const subBatch = batch.slice(k, k + SUB_BATCH_SIZE)
        const subTexts = subBatch.map((c) => c.text)
        const subVectors = await embedBatchWithRetry(subTexts)
        for (let l = 0; l < subBatch.length; l++) {
          embedded.push({
            ...subBatch[l],
            embedding: subVectors[l],
          })
        }
        await sleep(500)
      }
    }

    if (i + BATCH_SIZE < chunks.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS)
    }
  }

  return embedded
}
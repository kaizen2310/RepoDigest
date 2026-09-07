import mongoose from 'mongoose'
import { getGenAI, EMBEDDING_MODEL, DEFAULT_CHAT_MODEL } from './geminiClient.js'
import Chunk from '../models/chunk.js'

async function embedQuestion(question) {
  const ai = getGenAI()
  const result = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: question,
    config: {
      taskType: 'CODE_RETRIEVAL_QUERY',
    },
  })

  const values = result.embeddings?.[0]?.values
  if (!values) throw new Error('Gemini embedding response did not include values')
  return values
}

async function vectorSearch(embedding, owner, repo, ref, digestId, limit = 8) {
  const filterClause = digestId
    ? { digestId: new mongoose.Types.ObjectId(digestId.toString()) }
    : { owner, repo, ref }

  try {
    const results = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 100,
          limit,
          filter: filterClause,
        },
      },
      {
        $project: {
          _id: 1,
          digestId: 1,
          text: 1,
          filePath: 1,
          startLine: 1,
          endLine: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ])
    return results
  } catch (err) {
    console.warn('[chatService] vectorSearch error:', err.message)
    return []
  }
}

async function retrieveChunks(question, embedding, owner, repo, ref, digestId, limit = 8) {
  const digestObjectId = digestId ? new mongoose.Types.ObjectId(digestId.toString()) : null

  // 1. Direct file mention check (lexical retrieval for specific file queries)
  const fileTokens = question.match(/[\w.-]+\.[a-zA-Z0-9]+/g) || []
  let directFileChunks = []
  if (fileTokens.length > 0 && digestObjectId) {
    try {
      const cleanToken = fileTokens[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      directFileChunks = await Chunk.find({
        digestId: digestObjectId,
        filePath: { $regex: cleanToken, $options: 'i' },
      })
        .limit(4)
        .select('_id digestId text filePath startLine endLine')
        .lean()
    } catch (err) {
      console.warn('[chatService] Direct file lookup warning:', err.message)
    }
  }

  // 2. Vector search (semantic retrieval)
  const vectorChunks = await vectorSearch(embedding, owner, repo, ref, digestId, limit)

  // 3. Merge and deduplicate
  const chunkMap = new Map()
  for (const c of directFileChunks) {
    chunkMap.set(c._id.toString(), c)
  }
  for (const c of vectorChunks) {
    if (!chunkMap.has(c._id.toString())) {
      chunkMap.set(c._id.toString(), c)
    }
  }

  let merged = Array.from(chunkMap.values()).slice(0, limit)

  // 4. Fallback: text search if nothing was retrieved
  if (merged.length === 0 && digestObjectId) {
    try {
      merged = await Chunk.find({
        digestId: digestObjectId,
        $text: { $search: question },
      })
        .limit(limit)
        .select('_id digestId text filePath startLine endLine')
        .lean()
    } catch (textErr) {
      // ignore text search fallback errors
    }
  }

  return merged
}

function buildPrompt(question, chunks) {
  const context = chunks
    .map((c) => `[File: ${c.filePath}${c.startLine != null && c.endLine != null ? ` (lines ${c.startLine + 1}-${c.endLine + 1})` : ''}]\n${c.text}`)
    .join('\n\n---\n\n')

  return `You are an expert code assistant helping a developer understand a GitHub repository.

Answer the user's question clearly and accurately using the provided code context below.
If the answer is not supported by the context, reply with:
"I couldn't find relevant code for that question in the indexed files."
Do not speculate or make up information. When answering, reference the relevant file names and code snippets to support your answer.

CONTEXT:
${context}

QUESTION:
${question}`
}

export async function ragQuery(question, owner, repo, ref, digestId, onChunk) {
  const embedding = await embedQuestion(question)
  const results = await retrieveChunks(question, embedding, owner, repo, ref, digestId, 8)

  if (results.length === 0) {
    onChunk("I couldn't find relevant code for that question. The repo may still be processing — try again in a moment.")
    return
  }

  const prompt = buildPrompt(question, results)
  const ai = getGenAI()

  console.log('[chatService] Generating answer stream with model:', DEFAULT_CHAT_MODEL)

  const streamResult = await ai.models.generateContentStream({
    model: DEFAULT_CHAT_MODEL,
    contents: prompt,
    config: {
      temperature: 0.1,
    },
  })

  for await (const chunk of streamResult) {
    const text = chunk.text
    if (text) onChunk(text)
  }
}
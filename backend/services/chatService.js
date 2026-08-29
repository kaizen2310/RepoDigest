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

async function vectorSearch(embedding, owner, repo, ref, digestId, limit = 6) {
  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 60,
        limit: limit * 2, // fetch slightly more candidates for post-match filtering
        filter: {
          owner,
          repo,
          ref,
        },
      },
    },
    {
      $match: {
        digestId: new mongoose.Types.ObjectId(digestId.toString()),
      },
    },
    {
      $limit: limit,
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
  const results = await vectorSearch(embedding, owner, repo, ref, digestId)

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
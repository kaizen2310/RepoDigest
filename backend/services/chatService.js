import { GoogleGenAI } from '@google/genai'
import mongoose from 'mongoose'
import Chunk from '../models/chunk.js'

const EMBEDDING_MODEL = 'gemini-embedding-001'
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash'
let genAI



function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return genAI
}

async function embedQuestion(question) {
  const result = await getGenAI().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: question,
  })
  const values = result.embeddings?.[0]?.values
  if (!values) throw new Error('Gemini embedding response did not include values')
  return values
}

async function vectorSearch(embedding, owner, repo, ref, digestId, limit = 5) {
  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 50,
        limit,
        filter: {
          owner,
          repo,
          ref
        }
      }
    },
    {
      $match: {
        digestId: new mongoose.Types.ObjectId(digestId.toString())
      }
    },
    {
      $project: {
        _id: 1,
        digestId: 1,
        text: 1,
        filePath: 1,
        startLine: 1,
        endLine: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ])
  return results
}

function buildPrompt(question, chunks) {
  const context = chunks
    .map((c) => `[${c.filePath}]\n${c.text}`)
    .join('\n\n---\n\n')

  return `You are an expert code assistant helping a developer understand a GitHub repository.

Answer the question using ONLY the code context provided below.
If the answer is not directly supported by the context, reply with exactly:
I couldn't find relevant code for that question.
Do not add any extra explanation, speculation, or general repository knowledge.
When you can answer, keep it concise and mention the file names that support the answer.

CONTEXT:
${context}

QUESTION:
${question}`
}

export async function ragQuery(question, owner, repo, ref, digestId, onChunk) {
  const embedding = await embedQuestion(question)
  const results = await vectorSearch(embedding, owner, repo, ref, digestId)

  if (results.length === 0) {
    onChunk('I couldn\'t find relevant code for that question. The repo may still be processing — try again in a moment.')
    return
  }

  const prompt = buildPrompt(question, results)

  console.log('Using model:', CHAT_MODEL)
  
  const streamResult = await getGenAI().models.generateContentStream({
    model: CHAT_MODEL,
    contents: prompt,
    config: {
      temperature: 0,
    },
  })

  for await (const chunk of streamResult) {
    const text = chunk.text
    if (text) onChunk(text)
  }
}
import { ragQuery } from '../services/chatService.js'
import Digest from '../models/digest.js'
import Chunk from '../models/chunk.js'

export async function chat(req, res) {
  try {
    const { digestId } = req.params
    const { question } = req.body

    // validate
    if (!question?.trim()) {
      return res.status(400).json({ error: 'question is required' })
    }

    // check digest exists
    const digest = await Digest.findById(digestId)
    if (!digest) {
      return res.status(404).json({ error: 'Digest not found' })
    }

    // check ingest status
    if (digest.ingestStatus === 'pending' || digest.ingestStatus === 'processing') {
      return res.status(202).json({
        error: 'Repo is still being processed. Try again in a moment.'
      })
    }

    if (digest.ingestStatus === 'failed') {
      return res.status(500).json({
        error: 'Ingest failed for this repo. Try regenerating the digest.'
      })
    }

    // check chunks exist
    const chunkCount = await Chunk.countDocuments({ digestId })
    if (chunkCount === 0) {
      return res.status(202).json({
        error: 'No chunks found. Repo may still be processing.'
      })
    }

    // set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // stream answer chunk by chunk
    await ragQuery(
      question,
      digest.owner,
      digest.repo,
      digest.ref,
      digest._id,   // ← add
      (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    )

    // signal stream is done
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()

  } catch (err) {
    console.error('Chat error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message })
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
      res.end()
    }
  }
}

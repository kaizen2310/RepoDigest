import { parseGithubUrl, fetchRepoTree, fetchRepoMeta, fetchLatestCommitSha } from '../services/githubService.js'
import { generateDigest } from '../services/digestService.js'
import { chunkFiles } from '../services/chunkService.js'
import { embedChunks } from '../services/embedService.js'
import Digest from '../models/digest.js'
import Chunk from '../models/chunk.js'

const MAX_CHUNKS = 500

async function chunkAndEmbed(digestId, rawFiles, owner, repo, ref) {
  try {
    const currentDigest = await Digest.findById(digestId)
    if (!currentDigest) return

    await Digest.findByIdAndUpdate(digestId, {
      ingestStatus: 'processing',
      ingestError: null,
    })

    const chunks = chunkFiles(rawFiles)
    console.log(`[digestController] Chunked repository into ${chunks.length} chunks`)

    // check chunk limit before embedding
    if (chunks.length > MAX_CHUNKS) {
      await Digest.findByIdAndUpdate(digestId, {
        ingestStatus: 'too_large',
        ingestError: `Repo has ${chunks.length} chunks which exceeds the ${MAX_CHUNKS} limit for AI chat.`,
      })
      console.log(`[digestController] Skipping embedding — too large: ${chunks.length} chunks`)
      return
    }

    if (chunks.length === 0) {
      await Digest.findByIdAndUpdate(digestId, {
        ingestStatus: 'ready',
        ingestError: null,
      })
      return
    }

    // Step 1: Check if any chunk embeddings already exist in DB by chunkHash
    const allHashes = chunks.map((c) => c.chunkHash).filter(Boolean)
    const existingChunks = allHashes.length > 0
      ? await Chunk.find({ chunkHash: { $in: allHashes } }).select('chunkHash embedding').lean()
      : []

    const embeddingCache = new Map()
    for (const ec of existingChunks) {
      if (ec.chunkHash && ec.embedding && !embeddingCache.has(ec.chunkHash)) {
        embeddingCache.set(ec.chunkHash, ec.embedding)
      }
    }

    const uncachedChunks = []
    const readyChunks = []

    for (const chunk of chunks) {
      const cachedEmbedding = chunk.chunkHash ? embeddingCache.get(chunk.chunkHash) : null
      if (cachedEmbedding) {
        readyChunks.push({
          ...chunk,
          embedding: cachedEmbedding,
        })
      } else {
        uncachedChunks.push(chunk)
      }
    }

    console.log(
      `[digestController] Embedding lookup: ${readyChunks.length} reused from cache, ${uncachedChunks.length} require Gemini API`
    )

    // Step 2: Embed uncached chunks in batches
    let newlyEmbedded = []
    if (uncachedChunks.length > 0) {
      newlyEmbedded = await embedChunks(uncachedChunks)
    }

    const allEmbeddedChunks = [...readyChunks, ...newlyEmbedded]

    // Step 3: Replace chunks for this digest
    await Chunk.deleteMany({ digestId })

    const MONGO_BATCH = 100
    const docs = allEmbeddedChunks.map((chunk) => ({
      digestId,
      owner,
      repo,
      ref,
      filePath: chunk.filePath,
      text: chunk.text,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      tokens: chunk.tokens,
      chunkHash: chunk.chunkHash,
      embedding: chunk.embedding,
    }))

    for (let i = 0; i < docs.length; i += MONGO_BATCH) {
      await Chunk.insertMany(docs.slice(i, i + MONGO_BATCH))
    }
    console.log(`[digestController] Saved ${docs.length} chunks to MongoDB`)

    await Digest.findByIdAndUpdate(digestId, {
      ingestStatus: 'ready',
      ingestError: null,
    })
    console.log(`[digestController] Ingest complete for ${owner}/${repo}`)
  } catch (err) {
    await Digest.findByIdAndUpdate(digestId, {
      ingestStatus: 'failed',
      ingestError: err.message,
    })
    console.error('[digestController] Chunk and embed error:', err.message)
  }
}

export async function getDigestStatus(req, res) {
  try {
    const doc = await Digest.findById(req.params.id).select('ingestStatus ingestError')
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({
      ingestStatus: doc.ingestStatus,
      ingestError: doc.ingestError,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getRepoTree(req, res) {
  try {
    const { url } = req.body
    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }
    const { owner, repo, branch } = parseGithubUrl(url)

    const [{ files, ref, commitSha }, meta] = await Promise.all([
      fetchRepoTree(owner, repo, branch),
      fetchRepoMeta(owner, repo),
    ])

    res.json({ owner, repo, ref, commitSha, files, meta })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function generateRepoDigest(req, res) {
  try {
    let { owner, repo, ref, files, commitSha } = req.body
    if (!owner || !repo || !ref || !files?.length) {
      return res.status(400).json({ error: 'owner, repo, ref and files are required' })
    }

    // Resolve latest commit SHA if not supplied
    if (!commitSha) {
      commitSha = await fetchLatestCommitSha(owner, repo, ref)
    }

    // Lookup cache by commitSha (permanent exact cache)
    let cached = null
    if (commitSha) {
      cached = await Digest.findOne({
        owner,
        repo,
        ref,
        commitSha,
      })
    }

    // Fallback: 1-hour cache if commit SHA was unavailable
    if (!cached && !commitSha) {
      const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000)
      cached = await Digest.findOne({
        owner,
        repo,
        ref,
        createdAt: { $gte: ONE_HOUR_AGO },
      })
    }

    if (cached) {
      console.log(`[digestController] Cache HIT for ${owner}/${repo}@${ref} (SHA: ${commitSha || 'none'})`)

      // If already processing or pending, return current status and do not spawn duplicate job
      if (cached.ingestStatus === 'pending' || cached.ingestStatus === 'processing') {
        return res.json({
          id: cached._id,
          digest: cached.digest,
          tokenCount: cached.tokenCount,
          fileCount: cached.fileCount,
          commitSha: cached.commitSha,
          ingestStatus: cached.ingestStatus,
          fromCache: true,
        })
      }

      // Check if chunks exist for this digest
      const chunkCount = await Chunk.countDocuments({ digestId: cached._id })
      let ingestStatus = cached.ingestStatus

      if (
        chunkCount === 0 &&
        cached.ingestStatus !== 'too_large' &&
        cached.ingestStatus !== 'ready'
      ) {
        ingestStatus = 'pending'
        await Digest.findByIdAndUpdate(cached._id, {
          ingestStatus,
          ingestError: null,
        })

        const { rawFiles } = await generateDigest(owner, repo, files, ref)
        chunkAndEmbed(cached._id, rawFiles, owner, repo, ref)
      }

      return res.json({
        id: cached._id,
        digest: cached.digest,
        tokenCount: cached.tokenCount,
        fileCount: cached.fileCount,
        commitSha: cached.commitSha,
        ingestStatus,
        fromCache: true,
      })
    }

    console.log(`[digestController] Cache MISS for ${owner}/${repo}@${ref}. Generating digest...`)

    const { digest, tokenCount, fileCount, skipped, rawFiles } = await generateDigest(
      owner,
      repo,
      files,
      ref
    )

    const meta = await fetchRepoMeta(owner, repo)

    const saved = await Digest.create({
      owner,
      repo,
      ref,
      commitSha,
      digest,
      tokenCount,
      fileCount,
      meta,
      ingestStatus: 'pending',
    })

    chunkAndEmbed(saved._id, rawFiles, owner, repo, ref)

    res.json({
      id: saved._id,
      digest,
      tokenCount,
      fileCount,
      commitSha,
      skipped,
      ingestStatus: 'pending',
      fromCache: false,
    })
  } catch (err) {
    console.error('GENERATE ERROR:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function getDigestById(req, res) {
  try {
    const doc = await Digest.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Digest not found' })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

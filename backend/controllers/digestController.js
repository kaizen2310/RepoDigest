import { parseGithubUrl, fetchRepoTree, fetchRepoMeta } from '../services/githubService.js'
import { generateDigest } from '../services/digestService.js'
import { chunkFiles } from '../services/chunkService.js'
import { embedChunks } from '../services/embedService.js'
import Digest from '../models/digest.js'
import Chunk from '../models/chunk.js'

async function chunkAndEmbed(digestId, rawFiles, owner, repo, ref) {
  try {
    await Digest.findByIdAndUpdate(digestId, {
      ingestStatus: 'processing',
      ingestError: null
    })

    const chunks = chunkFiles(rawFiles)
    console.log(`Chunked into ${chunks.length} chunks`)

    const embeddedChunks = await embedChunks(chunks)
    console.log(`Embedded ${embeddedChunks.length} chunks`)

    // delete old chunks before inserting new ones
    await Chunk.deleteMany({ digestId })

    // batch insertMany to avoid MongoDB 16MB document limit
    const MONGO_BATCH = 100
    const docs = embeddedChunks.map((chunk) => ({
      digestId,
      owner,
      repo,
      ref,
      filePath: chunk.filePath,
      text: chunk.text,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      tokens: chunk.tokens,
      embedding: chunk.embedding,
    }))

    for (let i = 0; i < docs.length; i += MONGO_BATCH) {
      await Chunk.insertMany(docs.slice(i, i + MONGO_BATCH))
      console.log(`Saved ${Math.min(i + MONGO_BATCH, docs.length)}/${docs.length} chunks to MongoDB`)
    }

    await Digest.findByIdAndUpdate(digestId, {
      ingestStatus: 'ready',
      ingestError: null
    })
    console.log(`Ingest complete for ${owner}/${repo}`)

  } catch (err) {
    await Digest.findByIdAndUpdate(digestId, {
      ingestStatus: 'failed',
      ingestError: err.message
    })
    console.error('Chunk and embed error:', err.message)
  }
}

export async function getDigestStatus(req, res) {
  try {
    const doc = await Digest.findById(req.params.id)
      .select('ingestStatus ingestError')
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({
      ingestStatus: doc.ingestStatus,
      ingestError: doc.ingestError
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

    const [{ files, ref }, meta] = await Promise.all([
      fetchRepoTree(owner, repo, branch),
      fetchRepoMeta(owner, repo),
    ])

    res.json({ owner, repo, ref, files, meta })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function generateRepoDigest(req, res) {
  try {
    const { owner, repo, ref, files } = req.body
    if (!owner || !repo || !ref || !files?.length) {
      return res.status(400).json({ error: 'owner, repo, ref and files are required' })
    }

    const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000)
    const cached = await Digest.findOne({
      owner, repo, ref,
      createdAt: { $gte: ONE_HOUR_AGO },
    })

    if (cached) {
      // Check if chunks exist for this digest
      const chunkCount = await Chunk.countDocuments({ digestId: cached._id })

      // Chunks missing or ingest failed — re-trigger
      let ingestStatus = cached.ingestStatus

      if (chunkCount === 0 || cached.ingestStatus === 'failed') {
        ingestStatus = 'pending'
        await Digest.findByIdAndUpdate(cached._id, {
          ingestStatus,
          ingestError: null
        })

        const { rawFiles } = await generateDigest(owner, repo, files, ref)
        chunkAndEmbed(cached._id, rawFiles, owner, repo, ref)
      }

      return res.json({
        id: cached._id,
        digest: cached.digest,
        tokenCount: cached.tokenCount,
        fileCount: cached.fileCount,
        ingestStatus,
        fromCache: true,
      })
    }

    const { digest, tokenCount, fileCount, skipped, rawFiles } = await generateDigest(
      owner, repo, files, ref
    )

    const meta = await fetchRepoMeta(owner, repo)

    const saved = await Digest.create({
      owner, repo, ref, digest, tokenCount, fileCount, meta,
      ingestStatus: 'pending'
    })

    chunkAndEmbed(saved._id, rawFiles, owner, repo, ref)

    res.json({
      id: saved._id,
      digest,
      tokenCount,
      fileCount,
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

import crypto from 'crypto'

export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4)
}

export function calculateChunkHash(filePath, text) {
  return crypto
    .createHash('sha256')
    .update(`${filePath}\n${text}`)
    .digest('hex')
}

export const CHUNK_TOKENS = 850
export const OVERLAP_TOKENS = 80
export const MAX_CHUNK_CHARS = 8000

export function chunkFiles(files) {
  const chunks = []

  for (const file of files) {
    if (!file?.content || file.content.trim() === '') continue

    const lines = file.content.split('\n')
    let currentLines = []
    let currentTokens = 0
    let startLine = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineTokens = estimateTokens(line)

      if (currentTokens + lineTokens > CHUNK_TOKENS && currentLines.length > 0) {
        const rawChunk = `File: ${file.path}\n\n${currentLines.join('\n')}`
        const safeText = rawChunk.slice(0, MAX_CHUNK_CHARS)

        chunks.push({
          filePath: file.path,
          text: safeText,
          startLine,
          endLine: i - 1,
          tokens: currentTokens,
          chunkHash: calculateChunkHash(file.path, safeText),
        })

        let overlapLines = []
        let overlapTokens = 0

        for (let j = currentLines.length - 1; j >= 0; j--) {
          const t = estimateTokens(currentLines[j])
          if (overlapTokens + t > OVERLAP_TOKENS) break
          overlapLines.unshift(currentLines[j])
          overlapTokens += t
        }

        currentLines = overlapLines
        currentTokens = overlapTokens
        startLine = i - overlapLines.length
      }

      currentLines.push(line)
      currentTokens += lineTokens
    }

    if (currentLines.length > 0) {
      const rawChunk = `File: ${file.path}\n\n${currentLines.join('\n')}`
      const safeText = rawChunk.slice(0, MAX_CHUNK_CHARS)

      chunks.push({
        filePath: file.path,
        text: safeText,
        startLine,
        endLine: lines.length - 1,
        tokens: currentTokens,
        chunkHash: calculateChunkHash(file.path, safeText),
      })
    }
  }

  return chunks
}
function estimateTokens(text) {
  return Math.ceil(text.length / 4)
}

const CHUNK_TOKENS = 500
const OVERLAP_TOKENS = 100
const MAX_CHUNK_CHARS = 8000

export function chunkFiles(files) {
  const chunks = []

  for (const file of files) {
    // skip files with no content
    if (!file.content || file.content.trim() === '') continue

    const lines = file.content.split('\n')
    let currentLines = []
    let currentTokens = 0
    let startLine = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineTokens = estimateTokens(line)

      if (currentTokens + lineTokens > CHUNK_TOKENS && currentLines.length > 0) {
        const chunkText = `File: ${file.path}\n\n${currentLines.join('\n')}`

        chunks.push({
          filePath: file.path,
          text: chunkText.slice(0, MAX_CHUNK_CHARS),  // ← use safeText
          startLine,
          endLine: i - 1,
          tokens: currentTokens,
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
      const chunkText = `File: ${file.path}\n\n${currentLines.join('\n')}`
      chunks.push({
        filePath: file.path,
        text: chunkText.slice(0, MAX_CHUNK_CHARS),  // ← final chunk also safe
        startLine,
        endLine: lines.length - 1,
        tokens: currentTokens,
      })
    }
  }

  return chunks
}
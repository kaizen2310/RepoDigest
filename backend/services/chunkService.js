function estimateTokens(text) {
  return Math.ceil(text.length / 4)
}

const CHUNK_TOKENS = 500
const OVERLAP_TOKENS = 100

export function chunkFiles(files) {
  const chunks = []

  for (const file of files) {
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
          text: chunkText,
          startLine,
          endLine: i - 1,
          tokens: currentTokens,
        })

        // overlap by tokens not lines
        // walk backwards from end of current chunk
        // until we have collected OVERLAP_TOKENS worth
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

    // save final chunk
    if (currentLines.length > 0) {
      chunks.push({
        filePath: file.path,
        text: `File: ${file.path}\n\n${currentLines.join('\n')}`,
        startLine,
        endLine: lines.length - 1,
        tokens: currentTokens,
      })
    }
  }

  return chunks
}
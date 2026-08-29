import dotenv from 'dotenv'
dotenv.config()

import { chunkFiles, estimateTokens } from './services/chunkService.js'

console.log('--- 1. Testing chunkService ---')
const sampleFiles = [
  {
    path: 'src/utils/math.js',
    content: `export function add(a, b) {\n  return a + b;\n}\n\nexport function multiply(a, b) {\n  return a * b;\n}\n`
  },
  {
    path: 'src/index.js',
    content: `import { add, multiply } from './utils/math.js';\n\nconsole.log(add(2, 3));\nconsole.log(multiply(4, 5));\n`
  }
]

const chunks = chunkFiles(sampleFiles)
console.log(`Generated ${chunks.length} chunks.`)
console.log('Sample chunk:', {
  filePath: chunks[0]?.filePath,
  tokens: chunks[0]?.tokens,
  chunkHash: chunks[0]?.chunkHash,
  textSnippet: chunks[0]?.text.slice(0, 50) + '...'
})

if (!chunks[0]?.chunkHash) {
  throw new Error('Chunk hash was not generated!')
}

console.log('--- 2. Checking imports and Gemini client setup ---')
import { getGenAI, EMBEDDING_MODEL, DEFAULT_CHAT_MODEL } from './services/geminiClient.js'
console.log('Embedding model configured:', EMBEDDING_MODEL)
console.log('Chat model configured:', DEFAULT_CHAT_MODEL)

if (process.env.GEMINI_API_KEY) {
  console.log('--- 3. Testing Batch Embedding with Gemini API ---')
  import('./services/embedService.js').then(async ({ embedChunks }) => {
    try {
      const testChunks = [
        { filePath: 'test1.js', text: 'function helloWorld() { return "hello"; }' },
        { filePath: 'test2.js', text: 'function goodbyeWorld() { return "goodbye"; }' }
      ]
      const results = await embedChunks(testChunks)
      console.log(`Successfully embedded ${results.length} chunks via batch embedding.`)
      console.log(`Vector dimension: ${results[0].embedding.length}`)
      console.log('ALL TESTS PASSED SUCCESSFULLY!')
      process.exit(0)
    } catch (err) {
      console.error('Batch embedding test failed:', err)
      process.exit(1)
    }
  })
} else {
  console.log('GEMINI_API_KEY not present in environment; skipping live API call test.')
  console.log('ALL STATIC CHECKS PASSED SUCCESSFULLY!')
  process.exit(0)
}

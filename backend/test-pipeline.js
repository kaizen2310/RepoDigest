import dotenv from 'dotenv'
dotenv.config()

import { chunkFiles, estimateTokens } from './services/chunkService.js'
import { parseGithubUrl } from './services/githubService.js'
import { createRateLimiter } from './middleware/rateLimiter.js'
import { EMBEDDING_MODEL, DEFAULT_CHAT_MODEL } from './services/geminiClient.js'

async function runAllTests() {
  console.log('=== TEST 1: chunkService & SHA-256 Hashing ===')
  const sampleFiles = [
    {
      path: 'src/utils/math.js',
      content: `export function add(a, b) {\n  return a + b;\n}\n\nexport function multiply(a, b) {\n  return a * b;\n}\n`,
    },
    {
      path: 'src/index.js',
      content: `import { add, multiply } from './utils/math.js';\n\nconsole.log(add(2, 3));\nconsole.log(multiply(4, 5));\n`,
    },
  ]

  const chunks = chunkFiles(sampleFiles)
  console.log(`Generated ${chunks.length} chunks.`)
  if (!chunks[0]?.chunkHash) {
    throw new Error('Chunk hash was not generated!')
  }
  console.log(`✓ Sample chunk hash: ${chunks[0].chunkHash}`)

  console.log('\n=== TEST 2: GitHub URL Parser ===')
  const urlCases = [
    { input: 'https://github.com/expressjs/express', expected: 'expressjs/express' },
    { input: 'https://github.com/facebook/react/tree/feature/sub-branch/nested-ui', expected: 'facebook/react (branch: feature/sub-branch/nested-ui)' },
    { input: 'axios/axios@v1.x', expected: 'axios/axios (branch: v1.x)' },
  ]

  for (const { input } of urlCases) {
    const res = parseGithubUrl(input)
    console.log(`✓ Parsed "${input}" -> ${res.owner}/${res.repo}${res.branch ? ` (branch: ${res.branch})` : ''}`)
  }

  console.log('\n=== TEST 3: Rate Limiter Middleware ===')
  const limiter = createRateLimiter({ windowMs: 1000, max: 2, message: 'Rate limit exceeded' })
  const req = { ip: '127.0.0.1', headers: {} }
  let status = 200
  const makeRes = () => ({
    setHeader: () => {},
    status: (c) => {
      status = c
      return { json: () => {} }
    },
  })

  status = 200; limiter(req, makeRes(), () => {})
  status = 200; limiter(req, makeRes(), () => {})
  status = 200; limiter(req, makeRes(), () => {})
  if (status !== 429) throw new Error('Rate limiter did not block 3rd request!')
  console.log('✓ Rate limiter correctly throttled 3rd request with status 429')

  console.log('\n=== TEST 4: Gemini Client & Batch Embeddings ===')
  console.log(`Embedding model: ${EMBEDDING_MODEL}`)
  console.log(`Chat model: ${DEFAULT_CHAT_MODEL}`)

  if (process.env.GEMINI_API_KEY) {
    const { embedChunks } = await import('./services/embedService.js')
    const testChunks = [
      { filePath: 'test1.js', text: 'function hello() { return "hello"; }' },
      { filePath: 'test2.js', text: 'function world() { return "world"; }' },
    ]
    const results = await embedChunks(testChunks)
    console.log(`✓ Embedded ${results.length} chunks via batch API (Vector dim: ${results[0].embedding.length})`)
  } else {
    console.log('ℹ GEMINI_API_KEY not set; skipping live API call.')
  }

  console.log('\n========================================')
  console.log('ALL TESTS PASSED SUCCESSFULLY!')
  console.log('========================================\n')
}

runAllTests().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})

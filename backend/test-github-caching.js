import { parseGithubUrl } from './services/githubService.js'
import { createRateLimiter } from './middleware/rateLimiter.js'

console.log('=== TEST 1: GitHub URL Parsing ===')

const testCases = [
  {
    input: 'https://github.com/expressjs/express',
    expected: { owner: 'expressjs', repo: 'express', branch: null }
  },
  {
    input: 'https://github.com/expressjs/express/',
    expected: { owner: 'expressjs', repo: 'express', branch: null }
  },
  {
    input: 'https://github.com/expressjs/express.git',
    expected: { owner: 'expressjs', repo: 'express', branch: null }
  },
  {
    input: 'https://github.com/facebook/react/tree/main',
    expected: { owner: 'facebook', repo: 'react', branch: 'main' }
  },
  {
    input: 'https://github.com/facebook/react/tree/feature/sub-branch/nested-ui',
    expected: { owner: 'facebook', repo: 'react', branch: 'feature/sub-branch/nested-ui' }
  },
  {
    input: 'https://github.com/facebook/react/blob/main/packages/react/index.js',
    expected: { owner: 'facebook', repo: 'react', branch: 'main/packages/react/index.js' }
  },
  {
    input: 'axios/axios',
    expected: { owner: 'axios', repo: 'axios', branch: null }
  },
  {
    input: 'axios/axios@v1.x',
    expected: { owner: 'axios', repo: 'axios', branch: 'v1.x' }
  },
  {
    input: 'git@github.com:vitejs/vite.git',
    expected: { owner: 'vitejs', repo: 'vite', branch: null }
  }
]

let passed = 0
for (const tc of testCases) {
  try {
    const result = parseGithubUrl(tc.input)
    const match =
      result.owner === tc.expected.owner &&
      result.repo === tc.expected.repo &&
      result.branch === tc.expected.branch

    if (match) {
      console.log(`✓ Passed: "${tc.input}" -> ${JSON.stringify(result)}`)
      passed++
    } else {
      console.error(`✗ Failed: "${tc.input}"\n  Expected: ${JSON.stringify(tc.expected)}\n  Got:      ${JSON.stringify(result)}`)
    }
  } catch (err) {
    console.error(`✗ Error on "${tc.input}": ${err.message}`)
  }
}

if (passed !== testCases.length) {
  console.error(`URL parsing tests failed (${passed}/${testCases.length})`)
  process.exit(1)
}

console.log('\n=== TEST 2: Rate Limiter Middleware ===')
const testLimiter = createRateLimiter({ windowMs: 1000, max: 2, message: 'Rate limited!' })

const mockReq = { ip: '127.0.0.1', headers: {} }
let lastStatus = 200
let lastJson = null

const createMockRes = () => {
  const headers = {}
  return {
    setHeader: (k, v) => { headers[k] = v },
    status: (code) => {
      lastStatus = code
      return {
        json: (data) => { lastJson = data }
      }
    }
  }
}

// Request 1: allowed
lastStatus = 200
testLimiter(mockReq, createMockRes(), () => {})
console.log(`Req 1 status: ${lastStatus} (Expected 200)`)

// Request 2: allowed
lastStatus = 200
testLimiter(mockReq, createMockRes(), () => {})
console.log(`Req 2 status: ${lastStatus} (Expected 200)`)

// Request 3: blocked
lastStatus = 200
testLimiter(mockReq, createMockRes(), () => {})
console.log(`Req 3 status: ${lastStatus} (Expected 429), Error: ${lastJson?.error}`)

if (lastStatus !== 429) {
  console.error('Rate limiter test failed!')
  process.exit(1)
}

console.log('\nALL URL PARSING & RATE LIMITER TESTS PASSED SUCCESSFULLY!\n')

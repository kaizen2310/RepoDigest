import { Octokit } from '@octokit/rest'

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpeg', '.jpg', '.gif', '.webp', '.svg',
  '.pdf', '.mp3', '.mp4', '.ico', '.zip', '.woff',
  '.exe', '.woff2', '.ttf', '.tar', '.gz', '.7z',
  '.bin', '.pyc', '.wasm', '.jar', '.lockb'
])

const DEFAULT_IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build', 'out',
  '.next', '.nuxt', '__pycache__', 'package-lock.json',
  'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',

  '__tests__', 'test', 'tests', 'spec',
  '.github', 'coverage', '.turbo', '.cache',
  'changelog.md', 'license', 'licence',
])

let _octokit = null

function getOctokit() {
  if (!_octokit) {
    if (!process.env.GITHUB_TOKEN) {
      console.warn('[githubService] GITHUB_TOKEN is not set in environment variables. Falling back to unauthenticated client with lower rate limits.')
      _octokit = new Octokit()
    } else {
      _octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
    }
  }
  return _octokit
}

/**
 * Robust GitHub URL and shorthand repository parser.
 * Handles:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/feature/nested-branch
 * - https://github.com/owner/repo/blob/main/src/index.js
 * - https://github.com/owner/repo.git
 * - owner/repo or owner/repo@branch or owner/repo#branch
 */
export function parseGithubUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new Error('Please enter a valid repository URL or owner/repo identifier')
  }

  let input = rawInput.trim()

  // Remove surrounding git+ or git@ protocol wrappers if present
  input = input.replace(/^git\+/, '').replace(/^git@github\.com:/, 'https://github.com/')

  // Normalize shorthand like owner/repo or owner/repo@branch or owner/repo#branch
  if (!input.includes('://') && !input.startsWith('github.com')) {
    const atBranchIndex = input.indexOf('@')
    const hashBranchIndex = input.indexOf('#')

    let branch = null
    if (atBranchIndex !== -1) {
      branch = input.slice(atBranchIndex + 1).trim()
      input = input.slice(0, atBranchIndex).trim()
    } else if (hashBranchIndex !== -1) {
      branch = input.slice(hashBranchIndex + 1).trim()
      input = input.slice(0, hashBranchIndex).trim()
    }

    const parts = input.split('/').filter(Boolean)
    if (parts.length === 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace(/\.git$/, ''),
        branch: branch || null,
      }
    }
  }

  // Normalize to full URL
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    input = 'https://' + input
  }

  try {
    const urlObj = new URL(input)
    if (!urlObj.hostname.includes('github.com')) {
      throw new Error('URL must be a GitHub repository')
    }

    const segments = urlObj.pathname.split('/').filter(Boolean)
    if (segments.length < 2) {
      throw new Error('Invalid GitHub URL format: missing owner or repository name')
    }

    const owner = decodeURIComponent(segments[0])
    const repo = decodeURIComponent(segments[1]).replace(/\.git$/, '')

    let branch = null

    // Check for /tree/<branch...> or /blob/<branch...>
    if (segments.length >= 4 && (segments[2] === 'tree' || segments[2] === 'blob')) {
      // In case branch contains slashes (e.g. tree/feature/auth/ui), join remaining segments
      // If it's a blob URL, we also capture the branch name before file path if possible
      branch = decodeURIComponent(segments.slice(3).join('/'))
    }

    return {
      owner,
      repo,
      branch: branch || null,
    }
  } catch (err) {
    throw new Error(`Invalid GitHub repository input: ${err.message}`)
  }
}

export async function fetchLatestCommitSha(owner, repo, ref) {
  try {
    const { data } = await getOctokit().repos.getCommit({
      owner,
      repo,
      ref,
    })
    return data.sha
  } catch (err) {
    console.warn(`[githubService] Could not fetch commit SHA for ${owner}/${repo}@${ref}: ${err.message}`)
    return null
  }
}

export async function fetchRepoMeta(owner, repo) {
  const { data } = await getOctokit().repos.get({ owner, repo })
  return {
    description: data.description,
    stars: data.stargazers_count,
    language: data.language,
    license: data.license?.spdx_id || null,
    defaultBranch: data.default_branch,
  }
}

export async function fetchRepoTree(owner, repo, branch) {
  let ref = branch
  if (!ref) {
    const { data } = await getOctokit().repos.get({ owner, repo })
    ref = data.default_branch
  }

  // Fetch tree and commit SHA concurrently
  const [treeResponse, commitSha] = await Promise.all([
    getOctokit().git.getTree({
      owner,
      repo,
      tree_sha: ref,
      recursive: '1',
    }),
    fetchLatestCommitSha(owner, repo, ref),
  ])

  const files = (treeResponse.data.tree || [])
    .filter((item) => item.type === 'blob')
    .filter((item) => {
      const parts = item.path.split('/')
      if (parts.some((p) => DEFAULT_IGNORE.has(p))) return false

      // Check minified / map files
      if (item.path.endsWith('.min.js') || item.path.endsWith('.min.css') || item.path.endsWith('.map')) {
        return false
      }

      const ext = '.' + item.path.split('.').pop().toLowerCase()
      if (BINARY_EXTENSIONS.has(ext)) return false

      return true
    })
    .map((item) => item.path)

  return { files, ref, commitSha }
}

export async function fetchFileContent(owner, repo, path, ref) {
  try {
    const { data } = await getOctokit().repos.getContent({ owner, repo, path, ref })
    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return data.content
  } catch (err) {
    console.warn(`[githubService] Could not fetch ${path}: ${err.message}`)
    return null
  }
}
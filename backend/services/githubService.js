import { Octokit } from "@octokit/rest"

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpeg', '.jpg', '.gif', '.webp', '.svg',
  '.pdf', '.mp3', '.mp4', '.ico', '.zip', '.woff',
  '.exe', '.woff2', '.ttf',
])

const DEFAULT_IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build',
  '.next', '__pycache__', 'package-lock.json',
  'yarn.lock', 'pnpm-lock.yaml',

  '__tests__', 'test', 'tests', 'spec',
  '.github', 'coverage', 'docs',
  'changelog.md', 'license', 'licence',
])

let _octokit = null

function getOctokit() {
  if (!_octokit) {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is not set')
    }
    _octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  }
  return _octokit
}

export function parseGithubUrl(url) {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/
  )
  if (!match) throw new Error('Invalid Github URL entered')
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
    branch: match[3] || null
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

  const { data } = await getOctokit().git.getTree({
    owner,
    repo,
    tree_sha: ref,
    recursive: '1'
  })

  const files = data.tree
    .filter((item) => item.type === 'blob')
    .filter((item) => {
      const parts = item.path.split('/')
      if (parts.some((p) => DEFAULT_IGNORE.has(p))) return false
      const ext = '.' + item.path.split('.').pop().toLowerCase()
      if (BINARY_EXTENSIONS.has(ext)) return false
      return true
    })
    .map((item) => item.path)

  return { files, ref }
}

export async function fetchFileContent(owner, repo, path, ref) {
  try {
    const { data } = await getOctokit().repos.getContent({ owner, repo, path, ref })
    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return data.content
  } catch (err) {
    console.warn(`Could not fetch ${path}: ${err.message}`)
    return null
  }
}
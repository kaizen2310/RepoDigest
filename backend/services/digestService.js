import { fetchFileContent } from './githubService.js';

export function estimatedTokens(text) {
    return Math.ceil(text.length / 4)
}

export function buildDirectoryTree(filePaths){
    const tree = {}

    for(const filePath of filePaths){
        const parts = filePath.split('/')
        let node  = tree
        for(const part of parts){
            if(!node[part]) node[part] = {}
            node = node[part]
        }
    }

    function render(node,prefix = ''){
        const keys = Object.keys(node)
        return keys.map((key ,i) => {
            const isLast = i === keys.length -1
            const connector = isLast ? '└── ' : '├── '
            const childPrefix =  prefix + (isLast ? '   ' : '|   ')
            const hasChildren = Object.keys(node[key]).length >0
            const label = hasChildren ? key + '/' :key
            const childLines = hasChildren ? '\n' + render(node[key],childPrefix) : ''

            return prefix + connector + label + childLines
        }).join('\n')
    }

    return render(tree)
}

export async function generateDigest(owner, repo, filePaths, ref) {
  const BATCH_SIZE = 10
  const results = []
  const skipped = []

  for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
    const batch = filePaths.slice(i, i + BATCH_SIZE)
    const fetched = await Promise.all(
      batch.map(async (path) => {
        try {
          const content = await fetchFileContent(owner, repo, path, ref)
          return { path, content }
        } catch {
          skipped.push(path)
          return null
        }
      })
    )
    results.push(...fetched.filter(Boolean))
  }

  const treeString = buildDirectoryTree(filePaths)

  const header = [
    `================================================================`,
    `Repository: ${owner}/${repo}`,
    `Branch/Ref: ${ref}`,
    `Generated:  ${new Date().toISOString()}`,
    `Files:      ${results.length} included, ${skipped.length} skipped`,
    `================================================================`,
    ``,
    `DIRECTORY STRUCTURE`,
    `-------------------`,
    treeString,
    ``,
  ].join('\n')

  const fileSections = results.map(({ path, content }) =>
    [
      `================================================================`,
      `FILE: ${path}`,
      `================================================================`,
      content,
    ].join('\n')
  ).join('\n\n')

  const digest = header + '\n' + fileSections
  const tokenCount = estimatedTokens(digest)

  return {
    digest,
    tokenCount,
    fileCount: results.length,
    skipped,
    rawFiles: results   // ← add this
  }
}
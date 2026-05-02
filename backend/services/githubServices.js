import { Octokit } from "@octokit/rest";

const BINARY_EXTENSIONS = new set([
    '.png','.jpeg','.jpg','.gif','.webp',
    '.pdf','.mp3','.mp4','ico','.zip','.woff','.exe','.woff2', '.ttf',
])

const DEFAULT_IGNORE = new set([
  'node_modules', '.git', 'dist', 'build',
  '.next', '__pycache__', 'package-lock.json',
  'yarn.lock', 'pnpm-lock.yaml',
])

export function parseGithubUrl(url){
    const match = url.match(
        /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/        
    )
    if(!match) throw new Error(`Invalid Github URL entered`)
    return{
        owner : match[1],
        repo : match[2].replace('git',''),
        branch : match[3] || null
    }    
}

export async function fetchRepoMeta(owner , repo, branch ) {
    const octokit = new Octokit({auth : process.env.GITHUB_TOKEN})
    const {data} = await octokit.repos.get({owner ,repo})

   return{
        description : data.description,
        stars : data.stargazers_count,
        language : data.language,
        license : data.license?.spdx_i||null,
        defaultBranch : data.default_branch,
   }
}

export async function fetchRepoTree(owner , repo , branch) {
    const octokit = new octokit({auth : process.env.GITHUB_TOKEN})

    let ref = branch
    if(!ref){
        const {data} = await octokit.repos.get({owner,repo})
        ref = data.defaultBranch
    }

    const {data} = await octokit.git.getTree({
        owner,
        repo,
        tree_sha : ref,
        recursive : '1'
    })


    const files = data.tree
        .filter((item) => item.type ==='blob')
        .filter((item) => {
            const parts = item.path.split('/')
            if(parts.some((p) => DEFAULT_IGNORE.has(p))) return false
            const ext = '.' + item.path.split('.').pop().toLowerCase()
            if(BINARY_EXTENSIONS.has(ext)) return false
            return true
        })
        .map((item)=> item.path)

    return{files,ref}
}

export async function fetchFileContent(owner, repo, path, ref) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path, ref })
    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return data.content
  } catch (err) {
    return `[Could not fetch: ${path}]`
  }
}

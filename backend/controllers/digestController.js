import { parseGithubUrl,fetchRepoTree,fetchRepoMeta } from '../services/githubServices.js';
import { generateDigest } from '../services/digestServices.js';
import digest from '../models/digest.js';

export async function getRepoTree(req,res) {
    try{
        const {url} = req.body
        if(!url){
            return res.status(400).json({error : 'URL is required'})
        }
        const {owner,repo, branch} = parseGithubUrl(url)

        const [{files,ref},meta] = await Promise.all([
            fetchRepoTree(owner ,repo,branch),
            fetchRepoMeta(owner, repo)
        ])

        res.json({owner,repo,ref,files,meta})

    } catch (err){
        res.status(500).json({error :err.message})
    }
}

export async function generateRepoDigest(req,res) {
    try{
        const {owner,repo,ref,files} = req.body
        if(!owner || !repo || !ref || !files?.length){
            return res.status(400).json({error : 'owner,repo,ref and files are required'})
        }

        const ONE_HOUR_AGO = new Date(Date.now() - 60*60*1000)
        const cached = await Digest.findOne({
            owner,
            repo,
            ref,
            createdAt : {$gte :ONE_HOUR_AGO}
        })

        if(cached){
            return res.json({
                id : cached._id,
                digest :cached.digest,
                tokenCount :cached.tokenCount,
                fileCount : cached.fileCount,
                fileCache : true,
            })
        }

        const {digest,tokenCount,fileCount,skipped} =await generateDigest(
            owner,repo,files,ref
        )

        const meta = await fetchRepoMeta(owner ,repo)

        const saved =await Digest.create({
            owner,repo,ref,digest,tokenCount,fileCount,meta
        })

        res.json({
            id : saved._id,
            digest,tokenCount,fileCount,fileCount,skipped,
            fromCache : false,
        })

    }catch(err){
        res.status(500).json({error : err.message})
    }
}

export async function getDigestById(req,res) {
    try{
        const doc = await Digest.findById(req.params.id)
        if(!doc) return res.status(404).json({error : 'Digest not found'})
        res.json(doc)    
    }catch(err){
        res.status(500).json({err: err.message})
    }
    
}
import { parseGithubUrl, fetchRepoTree, fetchRepoMeta } from '../services/githubService.js'
import { generateDigest } from '../services/digestService.js'
import Digest from '../models/digest.js'
import crypto from 'crypto'

function filesHash(files) {
    return crypto
        .createHash('sha256')
        .update([...files].sort().join('\n'))
        .digest('hex')
}

async function generateAndCacheDigest({owner, repo, ref, files, meta}) {
    const hash = filesHash(files)
    const ONE_HOUR_AGO = new Date(Date.now() - 60*60*1000)
    const cached = await Digest.findOne({
        owner,
        repo,
        ref,
        filesHash : hash,
        createdAt : {$gte :ONE_HOUR_AGO}
    })

    if(cached){
        return {
            id : cached._id,
            digest : cached.digest,
            tokenCount : cached.tokenCount,
            fileCount : cached.fileCount,
            skipped : [],
            fromCache : true,
        }
    }

    const {digest,tokenCount,fileCount,skipped} = await generateDigest(
        owner,repo,files,ref
    )

    const saved = await Digest.create({
        owner,repo,ref,filesHash : hash,digest,tokenCount,fileCount,meta
    })

    return {
        id : saved._id,
        digest,tokenCount,fileCount,skipped,
        fromCache : false,
    }
}

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

export async function generateFullRepoDigest(req,res) {
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

        const result = await generateAndCacheDigest({
            owner,repo,ref,files,meta
        })

        res.json({owner,repo,ref,files,meta,...result})

    } catch (err){
        console.error('FULL DIGEST ERROR:', err)
        res.status(500).json({error :err.message})
    }
}

export async function generateRepoDigest(req,res) {
    try{
        const {owner,repo,ref,files} = req.body
        if(!owner || !repo || !ref || !files?.length){
            return res.status(400).json({error : 'owner,repo,ref and files are required'})
        }

        const meta = await fetchRepoMeta(owner ,repo)
        const result = await generateAndCacheDigest({
            owner,repo,ref,files,meta
        })

        res.json(result)

    }catch(err){
        console.error('GENERATE ERROR:', err)
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

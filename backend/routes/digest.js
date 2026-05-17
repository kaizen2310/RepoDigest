import {Router} from 'express'
import {
    generateFullRepoDigest,
    generateRepoDigest,
    getRepoTree,
    getDigestById
} from '../controllers/digestController.js'

const router = Router()

router.post('/tree',getRepoTree)
router.post('/full',generateFullRepoDigest)
router.post('/generate',generateRepoDigest)
router.get('/:id',getDigestById)

export default router

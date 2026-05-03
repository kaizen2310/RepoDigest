import {Router} from 'express'
import {
    generateRepoDigest,
    getRepoTree,
    getDigestById
} from '../controllers/digestController.js'

const router = Router()

router.post('/tree',getRepoTree)
router.post('/generate',generateRepoDigest)
router.post('/:id',getDigestById)

export default router
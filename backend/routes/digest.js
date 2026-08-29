import { Router } from 'express'
import {
  generateRepoDigest,
  getRepoTree,
  getDigestById,
  getDigestStatus,
} from '../controllers/digestController.js'
import { digestRateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/tree', digestRateLimiter, getRepoTree)
router.post('/generate', digestRateLimiter, generateRepoDigest)
router.get('/:id/status', getDigestStatus)
router.get('/:id', getDigestById)

export default router
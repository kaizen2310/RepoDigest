import { Router } from 'express'
import {
  generateRepoDigest,
  getRepoTree,
  getDigestById,
  getDigestStatus   // ← add this
} from '../controllers/digestController.js'

const router = Router()

router.post('/tree', getRepoTree)
router.post('/generate', generateRepoDigest)
router.get('/:id/status', getDigestStatus)   // ← add BEFORE /:id
router.get('/:id', getDigestById)

export default router
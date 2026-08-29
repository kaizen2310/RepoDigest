import { Router } from 'express'
import { chat } from '../controllers/chatController.js'
import { chatRateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/:digestId', chatRateLimiter, chat)

export default router
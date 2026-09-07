import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import digestRoutes from './routes/digest.js'
import chatRoutes from './routes/chat.js'

console.log('Token loaded:', !!process.env.GITHUB_TOKEN)

const app = express()
const PORT = process.env.PORT || 5000
const configuredOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : []

function allowCorsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true)
    return
  }

  const isConfiguredOrigin = configuredOrigins.includes(origin)
  const isLocalViteOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)

  callback(null, isConfiguredOrigin || isLocalViteOrigin)
}

app.use(cors({ origin: allowCorsOrigin }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/chat', chatRoutes)
app.use('/api/digest', digestRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'server is running',
  })
})


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('mongoDB connected')
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('mongoDB connection failed:', err.message)
    process.exit(1)
  })

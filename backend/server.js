import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import digestRoutes from './routes/digest.js'
import chatRoutes from './routes/chat.js'   // ← add


const app = express()
const PORT = process.env.PORT || 5000
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.use('/api/chat', chatRoutes)             // ← add
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

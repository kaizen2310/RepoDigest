import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env'), override: true })

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())

app.get('/api/health' , (req,res) => {
    res.json({
        status : 'ok',
        message : 'server is running'
    })
})

console.log("ENV FILE LOADED?");

console.log("MONGO_URI:", process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI in environment. Check backend/.env encoding and value.')
    process.exit(1)
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log(`mongoDB connected`)
        app.listen(PORT , () => {
            console.log(`Server is running on port ${PORT}`)
        })
    })
    .catch((err) => {
        console.error(`mongoDB connection failed :` , err.message)
        process.exit(1)
    })
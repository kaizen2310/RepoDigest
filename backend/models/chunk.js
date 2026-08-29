import mongoose from 'mongoose'

const chunkSchema = new mongoose.Schema(
  {
    digestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Digest',
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    repo: {
      type: String,
      required: true
    },
    ref: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    startLine: {
      type: Number
    },
    endLine: {
      type: Number
    },
    tokens: {
      type: Number
    },
    chunkHash: {
      type: String,
      index: true
    },
    embedding: {
      type: [Number],
      required: true,
    }
  },
  { timestamps: true }
)

chunkSchema.index({ digestId: 1 })
chunkSchema.index({ owner: 1, repo: 1, ref: 1 })
chunkSchema.index({ chunkHash: 1 })
chunkSchema.index({ text: 'text' })

export default mongoose.model('Chunk', chunkSchema)
import mongoose from 'mongoose'

const digestSchema = new mongoose.Schema(
  {
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
    digest: { 
        type: String,
        required: true
    },
    tokenCount: { 
        type: Number 
    },
    fileCount: { 
        type: Number
    },
    meta: {
      description: String,
      stars: Number,
      language: String,
      license: String,
    },
    ingestStatus: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'failed', 'too_large'],
      default: 'pending'
    },
    ingestError: {
      type: String,
      default: null
    },
    commitSha : {
      type : String,
      default :null
    }
  },
  { timestamps: true }
)

digestSchema.index({ owner: 1, repo: 1, ref: 1 })//caching

export default mongoose.model('Digest', digestSchema)
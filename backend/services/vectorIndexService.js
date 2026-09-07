import mongoose from 'mongoose'

const VECTOR_INDEX_NAME = 'vector_index'

export async function ensureVectorIndex() {
  try {
    const collection = mongoose.connection.db.collection('chunks')
    const indexes = await collection.listSearchIndexes().toArray()
    const exists = indexes.some((idx) => idx.name === VECTOR_INDEX_NAME)

    if (!exists) {
      console.log(`[Atlas Search] Creating index "${VECTOR_INDEX_NAME}" on chunks collection...`)
      await collection.createSearchIndex({
        name: VECTOR_INDEX_NAME,
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: 3072,
              similarity: 'cosine',
            },
            {
              type: 'filter',
              path: 'owner',
            },
            {
              type: 'filter',
              path: 'repo',
            },
            {
              type: 'filter',
              path: 'ref',
            },
            {
              type: 'filter',
              path: 'digestId',
            },
          ],
        },
      })
      console.log(`[Atlas Search] "${VECTOR_INDEX_NAME}" creation initiated.`)
    } else {
      console.log(`[Atlas Search] "${VECTOR_INDEX_NAME}" is active.`)
    }
  } catch (err) {
    // Non-blocking warning: in case of permissions or local replica set without Atlas Search
    console.warn('[Atlas Search] Search index check note:', err.message)
  }
}

import axios from 'axios'

export const API_BASE_URL = 'http://localhost:5000/api'

const api = axios.create({
    baseURL: API_BASE_URL
}) 


export async function fetchRepoTree(url) {
    const { data } = await api.post('/digest/tree', { url })
    return data
}


export async function generateDigest({ owner, repo, ref, files }) {
    const { data } = await api.post('/digest/generate', { owner, repo, ref, files })
    return data
}

export async function fetchDigestById(id) {
  const { data } = await api.get(`/digest/${id}`)
  return data
}

export async function streamChatResponse({ digestId, question, onText }) {
  const response = await fetch(`${API_BASE_URL}/chat/${digestId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const error = new Error(data?.error || 'Chat request failed')
    error.status = response.status
    throw error
  }

  if (!response.body) {
    throw new Error('Streaming response is not available')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''

    for (const event of events) {
      const line = event
        .split('\n')
        .find((item) => item.startsWith('data: '))

      if (!line) continue

      const payload = JSON.parse(line.slice(6))
      if (payload.error) {
        throw new Error(payload.error)
      }
      if (payload.done) {
        return
      }
      if (payload.text) {
        onText(payload.text)
      }
    }
  }
}

export async function fetchIngestStatus(id) {
  const { data } = await api.get(`/digest/${id}/status`)
  return data
}
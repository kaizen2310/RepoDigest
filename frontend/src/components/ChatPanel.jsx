import { useState } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

import {
  Bot,
  Send,
  User,
} from "lucide-react"

import { streamChatResponse } from '../services/api'

function MessageBubble({ role, text }) {
  const isUser = role === 'user'
  const Icon = isUser ? User : Bot

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-white">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[85%] overflow-hidden rounded-md border px-3 py-2 text-sm leading-6 ${
          isUser
            ? 'border-zinc-900 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">
          {text}
        </p>
      </div>
    </div>
  )
}

export default function ChatPanel({ digestId, ingestStatus }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const chatReady = ingestStatus === 'ready'

  async function submitQuestion(e) {
    e.preventDefault()

    const trimmed = question.trim()
    if (!trimmed || loading || !chatReady) return

    setError('')
    setQuestion('')
    setLoading(true)

    const assistantId = crypto.randomUUID()
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', text: trimmed },
      { id: assistantId, role: 'assistant', text: '' },
    ])

    try {
      await streamChatResponse({
        digestId,
        question: trimmed,
        onText: (text) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, text: message.text + text }
                : message
            )
          )
        },
      })
    } catch (err) {
      setError(err.message || 'Chat failed')
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId && !message.text
            ? { ...message, text: 'No answer was returned.' }
            : message
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border shadow-none">
      <CardContent className="flex min-h-0 flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Repo chat</h2>
              <p className="text-xs text-muted-foreground">
                {chatReady ? 'Ready' : 'Waiting for index'}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100vh-280px)] min-h-[420px] space-y-3 overflow-auto rounded-md border bg-zinc-50 p-3">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[130px] items-center justify-center text-center text-sm text-muted-foreground">
              Ask once indexing is ready.
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                text={message.text || (loading ? 'Thinking...' : '')}
              />
            ))
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={submitQuestion} className="mt-3 space-y-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={chatReady ? 'Ask about the codebase' : 'Indexing in progress'}
            disabled={!chatReady || loading}
            className="min-h-20 resize-none text-sm"
          />
          <Button
            type="submit"
            disabled={!chatReady || loading || !question.trim()}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? 'Streaming answer' : 'Ask'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

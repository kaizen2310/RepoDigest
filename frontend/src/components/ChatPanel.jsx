import { useEffect, useRef, useState } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

import {
  Bot,
  Send,
  User,
  Download,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"

import { streamChatResponse } from '../services/api'

function MessageBubble({ role, text }) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-white">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[85%] overflow-hidden rounded-md border px-3 py-2 text-sm leading-6 ${
          isUser
            ? 'border-zinc-900 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </div>
    </div>
  )
}

function TooLargeState({ ingestError }) {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-2">
      <Alert className="border-amber-200 bg-amber-50">
        <Download className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">
          Repo too large for AI chat
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          {ingestError || 'This repo exceeds the chunk limit for AI chat.'}
          {' '}Download the full digest and paste it into ChatGPT, Claude, or Gemini.
        </AlertDescription>
      </Alert>
      <Button
        disabled
        variant="outline"
        className="w-full opacity-50 cursor-not-allowed"
        size="sm"
      >
        AI chat not available for this repo
      </Button>
    </div>
  )
}

function ProcessingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-800">
          Indexing in progress
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          Building AI index for this repo.
          You can leave — indexing continues in the background.
        </p>
      </div>
      <Progress className="w-full" value={null} />
    </div>
  )
}

function PendingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Preparing index...</p>
    </div>
  )
}

function FailedState() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-2">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Indexing failed</AlertTitle>
        <AlertDescription>
          Try generating the digest again.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default function ChatPanel({ digestId, ingestStatus, ingestError }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  function renderBody() {
    if (ingestStatus === 'too_large') return <TooLargeState ingestError={ingestError} />
    if (ingestStatus === 'processing') return <ProcessingState />
    if (ingestStatus === 'failed') return <FailedState />
    if (ingestStatus === 'pending') return <PendingState />

    return (
      <>
        <div className="h-[calc(100vh-420px)] overflow-auto rounded-md border bg-zinc-50 p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Ask anything about this codebase.
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
          <div ref={bottomRef} />
        </div>

        {error && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={submitQuestion} className="mt-3 space-y-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitQuestion(e)
              }
            }}
            placeholder="Ask about the codebase"
            disabled={loading}
            className="min-h-20 resize-none text-sm"
          />
          <Button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? 'Streaming answer' : 'Ask'}
          </Button>
        </form>
      </>
    )
  }

  return (
    <Card className="border shadow-none">
      <CardContent className="flex min-h-0 flex-col p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Repo chat</h2>
            <p className="text-xs text-muted-foreground">
              {ingestStatus === 'ready' && 'Ready'}
              {ingestStatus === 'processing' && 'Indexing...'}
              {ingestStatus === 'pending' && 'Preparing...'}
              {ingestStatus === 'failed' && 'Failed'}
              {ingestStatus === 'too_large' && 'Not available'}
            </p>
          </div>
        </div>
        <div className="flex-1 min-h-[300px]">
          {renderBody()}
        </div>
      </CardContent>
    </Card>
  )
}
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
  Copy,
  Check,
  Sparkles,
} from "lucide-react"

import { streamChatResponse } from '../services/api'

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1 text-xs text-zinc-400">
        <span className="font-mono">{language || 'code'}</span>
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-5">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function FormattedContent({ text }) {
  if (!text) return null

  // Split by code blocks (```lang ... ```)
  const parts = text.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2 text-sm leading-6 break-words">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n')
          const language = part.slice(3, firstLineEnd !== -1 ? firstLineEnd : 3).trim()
          const code = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3)
          return <CodeBlock key={index} language={language} code={code} />
        }

        // Handle paragraphs and inline code inside regular text
        const paragraphs = part.split('\n\n').filter(Boolean)
        return (
          <div key={index} className="space-y-1.5">
            {paragraphs.map((p, pIdx) => {
              // Parse inline code `code`
              const inlineParts = p.split(/(`[^`]+`)/g)
              return (
                <p key={pIdx}>
                  {inlineParts.map((sub, sIdx) => {
                    if (sub.startsWith('`') && sub.endsWith('`') && sub.length > 2) {
                      return (
                        <code
                          key={sIdx}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground font-semibold"
                        >
                          {sub.slice(1, -1)}
                        </code>
                      )
                    }
                    return sub
                  })}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function MessageBubble({ role, text }) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-white text-zinc-900 shadow-xs">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[88%] overflow-hidden rounded-md border px-3 py-2.5 text-sm leading-6 ${
          isUser
            ? 'border-zinc-900 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900 shadow-2xs'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{text}</p>
        ) : (
          <FormattedContent text={text} />
        )}
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
          Building vector embeddings for this repo with Gemini.
          Indexing continues in the background.
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

const SUGGESTED_QUESTIONS = [
  'What is this repository about and what are its key features?',
  'What is the project structure and main entry point?',
  'What are the core dependencies and runtime requirements?',
]

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

  async function askQuestion(customQuestion) {
    const targetQuestion = (typeof customQuestion === 'string' ? customQuestion : question).trim()
    if (!targetQuestion || loading || !chatReady) return

    setError('')
    setQuestion('')
    setLoading(true)

    const assistantId = crypto.randomUUID()
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', text: targetQuestion },
      { id: assistantId, role: 'assistant', text: '' },
    ])

    try {
      await streamChatResponse({
        digestId,
        question: targetQuestion,
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

  function submitQuestion(e) {
    e.preventDefault()
    askQuestion()
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
            <div className="flex h-full flex-col items-center justify-center text-center p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200/60 text-zinc-700 mb-2">
                <Bot className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">Ask anything about this codebase</p>
              <p className="text-xs text-muted-foreground max-w-[280px] mt-1 mb-4">
                Answers are grounded using MongoDB Atlas Vector Search & Google Gemini.
              </p>

              <div className="w-full max-w-[340px] space-y-1.5 text-left">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Quick Repo Insights
                </p>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading || !chatReady}
                    onClick={() => askQuestion(q)}
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 shadow-2xs hover:bg-zinc-100 hover:border-zinc-300 transition-all flex items-center justify-between group text-left cursor-pointer"
                  >
                    <span>{q}</span>
                    <Sparkles className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                  </button>
                ))}
              </div>
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

        {messages.length > 0 && chatReady && !loading && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => askQuestion(q)}
                className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {q.length > 34 ? q.slice(0, 32) + '...' : q}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submitQuestion} className="mt-2 space-y-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitQuestion(e)
              }
            }}
            placeholder="Ask about components, routes, logic..."
            disabled={loading || !chatReady}
            className="min-h-20 resize-none text-sm"
          />
          <Button
            type="submit"
            disabled={loading || !question.trim() || !chatReady}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? 'Streaming answer...' : 'Ask codebase'}
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
            <h2 className="text-sm font-semibold">Repo Chat (RAG)</h2>
            <p className="text-xs text-muted-foreground">
              {ingestStatus === 'ready' && 'Ready for questions'}
              {ingestStatus === 'processing' && 'Indexing repository...'}
              {ingestStatus === 'pending' && 'Preparing embeddings...'}
              {ingestStatus === 'failed' && 'Indexing failed'}
              {ingestStatus === 'too_large' && 'Repo too large for RAG'}
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
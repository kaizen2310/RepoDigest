import { useEffect, useRef, useState } from 'react'

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import {
  Bot,
  Send,
  Download,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Sparkles,
  FileCode2,
  ExternalLink,
  CornerDownLeft,
  Trash2,
} from "lucide-react"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChatResponse } from '../services/api'

/* ─── Code Block ─── */
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
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors cursor-pointer"
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

/* ─── Markdown Renderer ─── */
function FormattedContent({ text }) {
  if (!text) return null

  return (

    <div className="text-sm leading-6 break-words text-zinc-900 dark:text-zinc-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <>{children}</>
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')
            const isMultiLine = codeString.includes('\n')
            if (match || isMultiLine) {
              return <CodeBlock language={match ? match[1] : ''} code={codeString} />
            }
            return (
              <code
                className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                {...props}
              >
                {children}
              </code>
            )
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0 leading-6">{children}</p>
          },
          ul({ children }) {
            return <ul className="list-disc list-outside ml-4 mb-2 space-y-1">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-outside ml-4 mb-2 space-y-1">{children}</ol>
          },
          li({ children }) {
            return <li className="leading-6">{children}</li>
          },
          h1({ children }) {
            return <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-sm font-bold mb-1.5 mt-2.5 first:mt-0">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>
          },
          strong({ children }) {
            return <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{children}</strong>
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80 font-medium"
              >
                {children}
              </a>
            )
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-3 my-2 text-muted-foreground italic">
                {children}
              </blockquote>
            )
          },
          hr() {
            return <hr className="my-3 border-zinc-200 dark:border-zinc-800" />
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <div className="flex items-center gap-0.5">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-muted-foreground ml-1">Thinking...</span>
    </div>
  )
}

/* ─── Message Thread ─── */
function MessageItem({ role, text, sources, isStreaming }) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? '' : 'min-w-0 flex-1'}`}>
        {isUser ? (
          /* User message — pill style */
          <div className="inline-block rounded-2xl rounded-br-sm bg-zinc-900 px-3.5 py-2 text-sm text-white">
            <p className="whitespace-pre-wrap break-words leading-6">{text}</p>
          </div>
        ) : (
          /* Bot message — clean thread style, no border box */
          <div className="pt-0.5">
            {text ? (
              <FormattedContent text={text} />
            ) : (
              <TypingIndicator />
            )}
            {/* Source citations */}
            {sources?.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  <FileCode2 className="h-3 w-3" />
                  <span>Sources</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`View ${src.filePath} on GitHub`}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 px-2 py-0.5 text-xs font-mono text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 transition-colors"
                    >
                      <span className="truncate max-w-[160px] sm:max-w-[220px]">{src.filePath}</span>
                      {src.startLine != null && (
                        <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">
                          L{src.startLine}{src.endLine && src.endLine !== src.startLine ? `–${src.endLine}` : ''}
                        </span>
                      )}
                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Status States ─── */
function TooLargeState({ ingestError }) {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-4">
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
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-800">
          Indexing in progress
        </p>
        <p className="text-xs leading-5 text-muted-foreground max-w-[260px]">
          Building vector embeddings for this repo.
          Chat will be available once indexing completes.
        </p>
      </div>
      <Progress className="w-48" value={null} />
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
    <div className="flex h-full flex-col justify-center gap-3 p-4">
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

/* ─── Constants ─── */
const SUGGESTED_QUESTIONS = [
  'What is this repository about?',
  'Explain the project structure',
  'What are the core dependencies?',
]

/* ─── Main ChatPanel ─── */
export default function ChatPanel({ digestId, ingestStatus, ingestError }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const bottomRef = useRef(null)
  const scrollRef = useRef(null)

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
      { id: assistantId, role: 'assistant', text: '', sources: [] },
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
        onSources: (sources) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, sources }
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

  function clearChat() {
    setMessages([])
    setError('')
  }

  /* ─── Non-ready states ─── */
  if (ingestStatus === 'too_large') return <TooLargeState ingestError={ingestError} />
  if (ingestStatus === 'processing') return <ProcessingState />
  if (ingestStatus === 'failed') return <FailedState />
  if (ingestStatus === 'pending') return <PendingState />

  /* ─── Chat UI ─── */
  return (
    <div className="flex h-full flex-col">

      {/* Header — minimal */}
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-none">Repo Chat</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] text-muted-foreground">Ready</span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            title="Clear conversation"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      <Separator />

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
        <div className="px-1 py-3 space-y-4">
          {messages.length === 0 ? (
            /* Empty state */
            <div className="flex h-[calc(100vh-520px)] flex-col items-center justify-center text-center px-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mb-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">Ask anything about this codebase</p>
              <p className="text-xs text-muted-foreground max-w-[260px] mt-1 mb-5">
                Powered by vector search &amp; Gemini. Answers are grounded in the repository's source code.
              </p>

              <div className="w-full max-w-[320px] space-y-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading || !chatReady}
                    onClick={() => askQuestion(q)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{q}</span>
                    <CornerDownLeft className="h-3 w-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageItem
                key={message.id}
                role={message.role}
                text={message.text}
                sources={message.sources}
                isStreaming={loading && message.role === 'assistant' && !message.text}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-1 pt-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Suggested follow-ups — compact pills */}
      {messages.length > 0 && chatReady && !loading && (
        <div className="flex flex-wrap gap-1.5 px-1 pt-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => askQuestion(q)}
              className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar — sticky bottom */}
      <div className="pt-3 mt-auto">
        <form onSubmit={submitQuestion} className="relative">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitQuestion(e)
              }
            }}
            placeholder="Ask about this codebase..."
            disabled={loading || !chatReady}
            className="min-h-[52px] max-h-32 resize-none pr-12 text-sm rounded-lg"
            rows={1}
          />
          <Button
            type="submit"
            disabled={loading || !question.trim() || !chatReady}
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CornerDownLeft className="h-2.5 w-2.5" />
            <span><kbd className="rounded border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 text-[9px] font-mono">Enter</kbd> to send · <kbd className="rounded border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 text-[9px] font-mono">Shift+Enter</kbd> new line</span>
          </p>
        </div>
      </div>
    </div>
  )
}
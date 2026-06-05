import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  Check,
  Copy,
  Download,
  TriangleAlert,
} from "lucide-react"

const TOKEN_LIMIT = 300000

export default function DigestOutput({ result, owner, repo }) {
  const [copied, setCopied] = useState(false)

  const overLimit = result.tokenCount > TOKEN_LIMIT
  const pct = Math.min(100, Math.round((result.tokenCount / TOKEN_LIMIT) * 100))

  const displayDigest = overLimit
    ? result.digest.slice(0, 300000) + '\n\n... [truncated - download for full digest]'
    : result.digest

  function copyToClipboard() {
    navigator.clipboard.writeText(result.digest)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadTxt() {
    const blob = new Blob([result.digest], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${owner}-${repo}-digest.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="flex flex-col p-0">

      {/* Over limit warning */}
      {overLimit && (
        <div className="mb-3 flex gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This repo exceeds 300k tokens - digest is truncated for display.
            Use the download button to get the full digest.
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">

        <Button onClick={copyToClipboard} className="sm:w-auto">
          {copied ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied' : 'Copy digest'}
        </Button>
        
        <Button variant="outline" onClick={downloadTxt} className="sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Download .txt
        </Button>
        
      </div>

      {/* Token bar */}
      <div className="mb-3">
        <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:justify-between">
          <span className="text-xs text-muted-foreground">Token usage (300k limit)</span>
          <span className={`text-xs font-medium ${overLimit ? 'text-red-600' : 'text-muted-foreground'}`}>
            {result.tokenCount?.toLocaleString()} / 300,000 ({pct}%)
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-gray-200">
          <div
            className={`h-full rounded ${
              overLimit
                ? 'bg-red-600'
                : pct > 80
                ? 'bg-yellow-500'
                : 'bg-emerald-500'
              }`}
            style={{ width: `${pct}%` }}
            />                    
        </div>
      </div>

      {/* Digest content */}
      <pre className="max-h-[calc(100vh-260px)] min-h-[420px] overflow-auto rounded-md bg-black p-4 text-left font-mono text-xs leading-6 text-zinc-200 whitespace-pre-wrap break-words">
        {displayDigest}
      </pre>
      </CardContent>
    </Card>
  )
}

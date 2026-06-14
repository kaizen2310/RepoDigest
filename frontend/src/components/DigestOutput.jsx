import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Check, Copy, Download, TriangleAlert } from "lucide-react"

const TOKEN_LIMIT = 300000

export default function DigestOutput({ result, owner, repo }) {
  const [copied, setCopied] = useState(false)

  const overLimit = result.tokenCount > TOKEN_LIMIT
  const pct = Math.min(100, Math.round((result.tokenCount / TOKEN_LIMIT) * 100))

  const displayDigest = overLimit
    ? result.digest.slice(0, 300000) + '\n\n... [truncated — download for full digest]'
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
      <CardContent className="flex flex-col gap-3 p-0">

        {/* Over limit warning */}
        {overLimit && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>
              Digest exceeds 300k tokens and is truncated for display.
              Download the full digest to use it.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={copyToClipboard} size="sm">
            {copied
              ? <><Check className="mr-2 h-3.5 w-3.5" />Copied</>
              : <><Copy className="mr-2 h-3.5 w-3.5" />Copy digest</>
            }
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTxt}>
            <Download className="mr-2 h-3.5 w-3.5" />
            Download .txt
          </Button>
        </div>

        {/* Token usage */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Token usage (300k limit)</span>
            <span className={`text-xs font-medium ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {result.tokenCount?.toLocaleString()} / 300,000 ({pct}%)
            </span>
          </div>
          <Progress
            value={pct}
            className={`h-1.5 ${overLimit ? '[&>div]:bg-destructive' : pct > 80 ? '[&>div]:bg-yellow-500' : ''}`}
          />
        </div>

        {/* Digest */}
        <pre className="max-h-[calc(100vh-260px)] min-h-[400px] overflow-auto rounded-md bg-zinc-950 p-4 text-left font-mono text-xs leading-6 text-zinc-200 whitespace-pre-wrap break-words">
          {displayDigest}
        </pre>

      </CardContent>
    </Card>
  )
}
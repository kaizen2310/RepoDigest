import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Check, Copy, Download, TriangleAlert, FileText, Info } from "lucide-react"
import { track } from '../lib/analytics'

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
    track('digest_copied', {
      digest_file_count: result.fileCount,
      digest_truncated: overLimit,
    })
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
    track('digest_downloaded', {
      digest_file_count: result.fileCount,
      digest_truncated: overLimit,
    })
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Toolbar — title + actions */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-none">Digest Output</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {result.fileCount} source files included · {result.tokenCount?.toLocaleString()} tokens
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 gap-1.5 px-2.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadTxt}
            className="h-8 gap-1.5 px-2.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Exclusion warning notice */}
      <div className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/5 px-2.5 py-1.5 text-xs text-muted-foreground shrink-0">
        <Info className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <span className="font-semibold text-foreground">Notice:</span> Some files may be excluded from this digest. Binary assets (images, fonts, audio), package lockfiles, and build artifacts (<code className="rounded bg-muted px-1 py-0.2 font-mono text-[10px]">dist</code>, <code className="rounded bg-muted px-1 py-0.2 font-mono text-[10px]">node_modules</code>) are omitted automatically to optimize for LLM context.
        </p>
      </div>

      {/* Over limit warning */}
      {overLimit && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 shrink-0">
          <TriangleAlert className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
            Digest exceeds 300k tokens — truncated for display.
            Use <button type="button" onClick={downloadTxt} className="underline underline-offset-2 font-medium hover:text-amber-900 dark:hover:text-amber-300 cursor-pointer">Download</button> for the full digest.
          </AlertDescription>
        </Alert>
      )}

      {/* Digest viewer */}
      <div className="relative rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Viewer header bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5">
          <span className="text-[11px] font-mono text-muted-foreground">
            {owner}/{repo}-digest.txt
          </span>
          <Badge variant="outline" className="text-[10px] h-4 font-mono px-1.5">
            {pct > 100 ? '100' : pct}% of 300k limit
          </Badge>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="h-[calc(100vh-300px)] min-h-[400px]">
          <pre className="p-4 text-left font-mono text-xs leading-6 text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words bg-white dark:bg-zinc-950">
            {displayDigest}
          </pre>
        </ScrollArea>
      </div>
    </div>
  )
}
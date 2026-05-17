import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  Star,
  GitFork,
  Files,
  FileCodeCorner,
  Binary,
  BookCheck,
} from "lucide-react"

export default function RepoSummary({ treeData, digestResult }) {
  const { owner, repo, ref, files, meta } = treeData
  const { tokenCount, fileCount } = digestResult

  const TOKEN_LIMIT = 300000
  const overLimit = tokenCount > TOKEN_LIMIT

  const pct = Math.min(
    100,
    Math.round((tokenCount / TOKEN_LIMIT) * 100)
  )

  return (
  <Card className="rounded-none border-x-0 border-t-0 shadow-none bg-white">
    
    <CardContent className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">

      {/* LEFT SIDE */}
      <div className="flex flex-col gap-3">

        {/* Repo title */}
        <div className="flex flex-col">

          <span className="text-xl font-bold tracking-tight">
            {owner}
            <span className="text-muted-foreground">
              /{repo}
            </span>
          </span>

          {meta.description && (
            <span className="max-w-[700px] text-sm text-muted-foreground">
              {meta.description}
            </span>
          )}

        </div>

        {/* Repo badges */}
        <div className="flex flex-wrap items-center gap-2">

          <Badge variant="secondary">
            <GitFork className="mr-1 h-3 w-3" />{ref}
          </Badge>

          <Badge variant="outline">
            <Files className="mr-1 h-3 w-3" />: {files.length} Totalfiles
          </Badge>

          <Badge variant="outline">
            <BookCheck className="mr-1 h-3 w-3" />Digested: {fileCount}
          </Badge>

          {meta.language && (
            <Badge variant="outline">
              <FileCodeCorner className="mr-1 h-3 w-3" />{meta.language}
            </Badge>
          )}

          {!!meta.stars && (
            <Badge variant="outline">
              ⭐ {meta.stars.toLocaleString()}
            </Badge>
          )}

        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">

        <span className="text-sm text-muted-foreground">
          Tokens
        </span>

        <span
          className={`text-lg font-bold ${
            overLimit ? 'text-red-600' : ''
          }`}
        >
          {tokenCount.toLocaleString()}
        </span>

        {/* Progress */}
        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">

          <div
            className={`h-full rounded-full ${
              overLimit
                ? 'bg-red-600'
                : pct > 80
                ? 'bg-yellow-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />

        </div>

        <span
          className={`text-sm ${
            overLimit
              ? 'text-red-600'
              : 'text-muted-foreground'
          }`}
        >
          {pct}% of 300k
        </span>

      </div>

    </CardContent>

  </Card>
  )
}
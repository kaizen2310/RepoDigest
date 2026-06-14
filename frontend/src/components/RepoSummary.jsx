import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GitFork, Files, FileCode2, BookCheck, Star } from "lucide-react"

const TOKEN_LIMIT = 300000

export default function RepoSummary({ treeData, digestResult }) {
  const { owner, repo, ref, files, meta } = treeData
  const { tokenCount, fileCount } = digestResult

  const overLimit = tokenCount > TOKEN_LIMIT
  const pct = Math.min(100, Math.round((tokenCount / TOKEN_LIMIT) * 100))

  return (
    <Card className="rounded-none border-x-0 border-t-0 shadow-none bg-background">
      <CardContent className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">

        {/* Left */}
        <div className="min-w-0 flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight leading-snug">
              {owner}
              <span className="text-muted-foreground">/{repo}</span>
            </span>
            {meta.description && (
              <span className="max-w-[600px] text-xs leading-5 text-muted-foreground">
                {meta.description}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              <GitFork className="mr-1 h-3 w-3" />{ref}
            </Badge>
            <Badge variant="outline">
              <Files className="mr-1 h-3 w-3" />{files.length} files
            </Badge>
            <Badge variant="outline">
              <BookCheck className="mr-1 h-3 w-3" />{fileCount} digested
            </Badge>
            {meta.language && (
              <Badge variant="outline">
                <FileCode2 className="mr-1 h-3 w-3" />{meta.language}
              </Badge>
            )}
            {!!meta.stars && (
              <Badge variant="outline">
                <Star className="mr-1 h-3 w-3" />{meta.stars.toLocaleString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Right — token usage */}
        <div className="flex shrink-0 flex-col gap-1.5 rounded-md border bg-muted/30 px-4 py-2.5 min-w-[200px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Token usage</span>
            <span className={`text-xs font-semibold ${overLimit ? 'text-destructive' : ''}`}>
              {pct}% of 300k
            </span>
          </div>
          <Progress
            value={pct}
            className={`h-1.5 ${overLimit ? '[&>div]:bg-destructive' : pct > 80 ? '[&>div]:bg-yellow-500' : ''}`}
          />
          <span className={`text-xs font-medium ${overLimit ? 'text-destructive' : 'text-foreground'}`}>
            {tokenCount.toLocaleString()} tokens
          </span>
        </div>

      </CardContent>
    </Card>
  )
}
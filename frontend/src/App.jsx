import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, Plus } from "lucide-react"

import RepoInput from './components/RepoInput'
import DigestOutput from './components/DigestOutput'
import RepoSummary from './components/RepoSummary'
import ChatPanel from './components/ChatPanel'

import { fetchIngestStatus, fetchRepoTree, generateDigest } from './services/api'

function GitHubIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

const STEPS = { IDLE: 'idle', DASHBOARD: 'dashboard' }

const EXAMPLE_REPOS = [
  'https://github.com/expressjs/express',
  'https://github.com/axios/axios',
  'https://github.com/vitejs/vite',
]

export default function App() {
  const [step, setStep] = useState(STEPS.IDLE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [treeData, setTreeData] = useState(null)
  const [digestResult, setDigestResult] = useState(null)

  const digestId = digestResult?.id || digestResult?._id
  const ingestStatus = digestResult?.ingestStatus || 'pending'

  useEffect(() => {
    if (!digestId || !['pending', 'processing'].includes(ingestStatus)) return
    const timer = window.setInterval(async () => {
      try {
        const latest = await fetchIngestStatus(digestId)
        setDigestResult((current) => ({ ...current, ...latest }))
      } catch (err) {
        setError('Failed to refresh status')
      }
    }, 2500)
    return () => window.clearInterval(timer)
  }, [digestId, ingestStatus])

  async function handleUrlSubmit(url) {
    setError('')
    setLoading(true)
    try {
      const tree = await fetchRepoTree(url)
      setTreeData(tree)
      const result = await generateDigest({
        owner: tree.owner,
        repo: tree.repo,
        ref: tree.ref,
        files: tree.files,
        commitSha: tree.commitSha,
      })
      setDigestResult({ ...result, id: result.id || result._id })
      setStep(STEPS.DASHBOARD)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch repository')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep(STEPS.IDLE)
    setTreeData(null)
    setDigestResult(null)
    setError('')
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 text-foreground">

      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65 shadow-2xs">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6">
          {/* Brand & Logo */}
          <div
            onClick={step === STEPS.DASHBOARD ? reset : undefined}
            className={`flex items-center gap-3 select-none ${step === STEPS.DASHBOARD ? 'cursor-pointer group' : ''}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 text-white shadow-xs dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-300 dark:text-zinc-900 ring-1 ring-black/10 group-hover:scale-105 transition-transform">
              <span className="font-mono text-xs font-black tracking-tight">RD</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight leading-none text-foreground group-hover:text-primary transition-colors">
                RepoDigest
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 hidden sm:inline leading-none">
                LLM-ready codebase digests & RAG
              </span>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {step === STEPS.DASHBOARD && treeData && (
              <a
                href={`https://github.com/${treeData.owner}/${treeData.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open ${treeData.owner}/${treeData.repo} on GitHub`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border/80 hover:bg-accent hover:text-accent-foreground transition-all shadow-2xs"
                >
                  <GitHubIcon className="h-3.5 w-3.5 text-foreground" />
                  <span className="hidden sm:inline">View on GitHub</span>
                  <span className="sm:hidden">Repo</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Button>
              </a>
            )}

            {step === STEPS.DASHBOARD && (
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="h-8 gap-1 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New repo</span>
              </Button>
            )}

            {/* Star RepoDigest on GitHub */}
            <a
              href="https://github.com/kaizen2310/RepoDigest"
              target="_blank"
              rel="noopener noreferrer"
              title="RepoDigest on GitHub"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 text-xs font-medium text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground transition-all"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Star on GitHub</span>
              <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/70" />
            </a>
          </div>
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div className="px-4 pt-3 sm:px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* LANDING */}
      {step === STEPS.IDLE && (
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="w-full max-w-2xl">
            <h1 className="mb-3 text-4xl font-black tracking-tight sm:text-5xl">
              RepoDigest
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-7 text-muted-foreground">
              Generate clean, structured LLM-ready digests from any GitHub repository.
            </p>

            <RepoInput onSubmit={handleUrlSubmit} loading={loading} />

            <div className="mt-6 min-h-[60px]">
              {loading ? (
                <p className="text-sm text-muted-foreground">
                  Fetching repository — large repos may take 10–20 seconds...
                </p>
              ) : (
                <div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Try an example:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {EXAMPLE_REPOS.map((repo) => (
                      <Button
                        key={repo}
                        variant="outline"
                        size="sm"
                        onClick={() => handleUrlSubmit(repo)}
                        className="font-mono text-xs"
                      >
                        {repo.replace('https://github.com/', '')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* DASHBOARD */}
      {step === STEPS.DASHBOARD && treeData && digestResult && (
        <main className="flex flex-1 flex-col">
          <RepoSummary treeData={treeData} digestResult={digestResult} />
          <div className="grid flex-1 lg:grid-cols-2">

            {/* Left — digest */}
            <div className="border-r bg-background">
              <div className="p-4 sm:p-6">
                <DigestOutput
                  result={digestResult}
                  owner={treeData.owner}
                  repo={treeData.repo}
                />
              </div>
            </div>

            {/* Right — chat only */}
            <div className="flex flex-col bg-white p-4 lg:sticky lg:top-[57px] lg:max-h-[calc(100vh-57px)]">
              <ChatPanel
                digestId={digestId}
                ingestStatus={ingestStatus}
                ingestError={digestResult?.ingestError}
              />
            </div>

          </div>
        </main>
      )}
    </div>
  )
}
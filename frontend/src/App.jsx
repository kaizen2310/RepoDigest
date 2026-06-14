import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

import RepoInput from './components/RepoInput'
import DigestOutput from './components/DigestOutput'
import RepoSummary from './components/RepoSummary'
import ChatPanel from './components/ChatPanel'

import { fetchIngestStatus, fetchRepoTree, generateDigest } from './services/api'

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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground text-base font-bold text-background">
              R
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight leading-none">
                RepoDigest
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                LLM-ready GitHub digests
              </span>
            </div>
          </div>
          {step === STEPS.DASHBOARD && (
            <Button variant="outline" size="sm" onClick={reset}>
              New repo
            </Button>
          )}
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
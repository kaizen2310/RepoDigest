import { useEffect, useState } from 'react'

import RepoInput from './components/RepoInput'
import DigestOutput from './components/DigestOutput'
import RepoSummary from './components/RepoSummary'
import ChatPanel from './components/ChatPanel'
import IngestStatus from './components/IngestStatus'

import { fetchIngestStatus, fetchRepoTree, generateDigest } from './services/api'
import { Button } from "@/components/ui/button"

const STEPS = {
  IDLE: 'idle',
  DASHBOARD: 'dashboard'
}

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
        setError(err.response?.data?.error || 'Failed to refresh status')
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
    <div className="flex min-h-screen flex-col bg-[#f6f7f8] text-foreground">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black text-lg font-bold text-white">
              R
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">RepoDigest</span>
              <span className="text-xs text-muted-foreground">Generate LLM-ready repository digests</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {step === STEPS.DASHBOARD && (
              <Button variant="outline" onClick={reset}>New repo</Button>
            )}
          </div>
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 sm:px-6">
          {error}
        </div>
      )}

      {/* LANDING */}
      {step === STEPS.IDLE && (
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
              RepoDigest
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Generate clean, structured LLM-ready digests from GitHub repositories.
            </p>
            <RepoInput onSubmit={handleUrlSubmit} loading={loading} />
            {loading && (
              <div className="mt-8">
                <span className="text-sm text-muted-foreground">
                  Fetching repository and generating digest...
                </span>
              </div>
            )}
          </div>
        </main>
      )}

      {/* DASHBOARD */}
      {step === STEPS.DASHBOARD && treeData && digestResult && (
        <main className="flex flex-1 flex-col">

          {/* Summary bar */}
          <RepoSummary treeData={treeData} digestResult={digestResult} />

          {/* Two column layout */}
          <div className="grid flex-1 items-start lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">

            {/* Left: digest content has its own scroll area */}
            <div className="border-r bg-white">
              <div className="p-4 sm:p-6">
                <DigestOutput
                  result={digestResult}
                  owner={treeData.owner}
                  repo={treeData.repo}
                />
              </div>
            </div>

            {/* Right: ingest status + chat */}
            <div className="flex flex-col gap-3 bg-muted/30 p-4 lg:sticky lg:top-[73px] lg:max-h-[calc(100vh-73px)]">

              {/* Ingest status: fixed height, doesn't grow */}
              <div className="shrink-0 rounded-md border bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Backend ingest</span>
                  <IngestStatus
                    status={ingestStatus}
                    error={digestResult.ingestError}
                  />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Digest is available now. Repo chat unlocks after chunks and embeddings are ready.
                </p>
              </div>

              {/* Chat: takes all remaining height */}
              <div className="min-h-0">
                <ChatPanel
                  digestId={digestId}
                  ingestStatus={ingestStatus}
                />
              </div>

            </div>
          </div>
        </main>
      )}
    </div>
  )
}

import { useState } from 'react'

import RepoInput from './components/RepoInput'
import DigestOutput from './components/DigestOutput'
import DirectoryTree from './components/DirectoryTree'
import RepoSummary from './components/RepoSummary'

import { fetchRepoTree, generateDigest } from './services/api'

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

      setDigestResult(result)

      setStep(STEPS.DASHBOARD)

    } catch (err) {

      setError(
        err.response?.data?.error ||
        'Failed to fetch repository'
      )

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

    <div className="min-h-screen bg-[#f5f5f5] text-foreground">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">

        <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-3">

            {/* Logo */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg font-bold text-white">
              R
            </div>

            {/* Brand */}
            <div className="flex flex-col">

              <span className="text-lg font-bold tracking-tight">
                RepoDigest
              </span>

              <span className="text-xs text-muted-foreground">
                Generate LLM-ready repository digests
              </span>

            </div>

          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {step === STEPS.DASHBOARD && (

              <Button
                variant="outline"
                onClick={reset}
              >
                New Repo
              </Button>

            )}

          </div>

        </div>

      </header>

      {/* ERROR */}
      {error && (

        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-600">
          {error}
        </div>

      )}

      {/* LANDING */}
      {step === STEPS.IDLE && (

        <div className="flex flex-col items-center justify-center px-6 py-32 text-center">

          <div className="max-w-3xl">

            <h1 className="mb-5 text-5xl font-black tracking-tight">

              Ingest any
              <span className="block">
                GitHub repository
              </span>

            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
                <div className="justify-center">
                  <RepoInput
                    onSubmit={handleUrlSubmit}
                    loading={loading}
                  />
                </div>
                <br></br>
              Generate clean, structured<br></br>
              LLM-ready digests from GitHub repositories instantly.
            </p>

            {loading && (

              <div className="mt-8">

                <span className="text-sm text-muted-foreground">
                  Fetching repository and generating digest...
                </span>

              </div>

            )}

          </div>

        </div>

      )}

      {/* DASHBOARD */}
      {step === STEPS.DASHBOARD &&
        treeData &&
        digestResult && (

        <div className="flex h-[calc(100vh-73px)] flex-col">

          {/* Summary */}
          <RepoSummary
            treeData={treeData}
            digestResult={digestResult}
          />

          {/* Main content */}
          <div className="grid flex-1 overflow-hidden lg:grid-cols-[1fr_360px]">

            {/* LEFT */}
            <div className="overflow-auto border-r bg-white p-6">

              <DigestOutput
                result={digestResult}
                owner={treeData.owner}
                repo={treeData.repo}
              />

            </div>

            {/* RIGHT */}
            <div className="overflow-auto bg-muted/30 p-4">

              <DirectoryTree
                files={treeData.files}
              />

            </div>

          </div>

        </div>

      )}

    </div>

  )

}
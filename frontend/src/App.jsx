import { useState } from 'react'
import RepoInput from './components/RepoInput'
import FileTree from './components/FileTree'
import DigestOutput from './components/DigestOutput'
import { generateDigest, generateFullDigest } from './services/api'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [generatingSelection, setGeneratingSelection] = useState(false)
  const [error, setError] = useState('')
  const [repoData, setRepoData] = useState(null)
  const [digestResult, setDigestResult] = useState(null)
  const dashboardReady = repoData && digestResult

  async function handleUrlSubmit(url) {
    setError('')
    setLoading(true)
    setRepoData(null)
    setDigestResult(null)

    try {
      const data = await generateFullDigest(url)
      const nextRepoData = {
        owner: data.owner,
        repo: data.repo,
        branchRef: data.ref,
        files: data.files,
        meta: data.meta,
      }
      setRepoData(nextRepoData)
      setDigestResult({
        id: data.id,
        digest: data.digest,
        tokenCount: data.tokenCount,
        fileCount: data.fileCount,
        skipped: data.skipped,
        fromCache: data.fromCache,
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch repo and generate digest')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateSelected(selectedFiles) {
    if (!repoData) return

    setError('')
    setGeneratingSelection(true)
    try {
      const result = await generateDigest({
        owner: repoData.owner,
        repo: repoData.repo,
        ref: repoData.branchRef,
        files: selectedFiles,
      })
      setDigestResult(result)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate selected-file digest')
    } finally {
      setGeneratingSelection(false)
    }
  }

  function reset() {
    setRepoData(null)
    setDigestResult(null)
    setError('')
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#111', textAlign: 'left' }}>
      <header style={headerStyle}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>RepoDigest</span>
        {dashboardReady && (
          <button onClick={reset} style={newRepoButton}>
            New repo
          </button>
        )}
      </header>

      <main style={dashboardReady ? dashboardMain : landingMain}>
        {!dashboardReady && (
          <section style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
            <h1 style={{ fontSize: 36, fontWeight: 650, margin: '0 0 10px' }}>
              Ingest a GitHub repo
            </h1>
            <p style={{ color: '#666', marginBottom: 32 }}>
              Paste a URL once. RepoDigest will build the full digest and prepare file selection after the first pass.
            </p>
            <RepoInput onSubmit={handleUrlSubmit} loading={loading} />
            {loading && (
              <p style={{ color: '#666', fontSize: 13, marginTop: 14 }}>
                Fetching the project tree and generating the full digest...
              </p>
            )}
          </section>
        )}

        {error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        {dashboardReady && (
          <>
            <RepoSummary repoData={repoData} result={digestResult} />
            <section className="dashboard-grid" style={dashboardGrid}>
              <div style={{ minWidth: 0 }}>
                <DigestOutput
                  result={digestResult}
                  owner={repoData.owner}
                  repo={repoData.repo}
                />
              </div>
              <aside className="tree-panel" style={treePanel}>
                <FileTree
                  files={repoData.files}
                  meta={repoData.meta}
                  owner={repoData.owner}
                  repo={repoData.repo}
                  branchRef={repoData.branchRef}
                  onGenerate={handleGenerateSelected}
                  loading={generatingSelection}
                />
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function RepoSummary({ repoData, result }) {
  return (
    <section style={summaryBar}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, wordBreak: 'break-word' }}>
          {repoData.owner}/{repoData.repo}
        </div>
        <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
          {repoData.branchRef} - {repoData.files.length} available files
          {repoData.meta?.language ? ` - ${repoData.meta.language}` : ''}
          {repoData.meta?.stars ? ` - ${repoData.meta.stars.toLocaleString()} stars` : ''}
        </div>
        {repoData.meta?.description && (
          <p style={{ color: '#555', fontSize: 13, marginTop: 8 }}>
            {repoData.meta.description}
          </p>
        )}
      </div>
      <div style={summaryStats}>
        <SummaryStat label="Digest files" value={result.fileCount} />
        <SummaryStat label="Tokens" value={result.tokenCount?.toLocaleString()} />
      </div>
    </section>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div>
      <div style={{ color: '#777', fontSize: 11 }}>{label}</div>
      <div style={{ color: '#111', fontWeight: 700, fontSize: 16 }}>{value}</div>
    </div>
  )
}

const headerStyle = {
  borderBottom: '1px solid #eee',
  padding: '16px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const newRepoButton = {
  fontSize: 13,
  padding: '7px 12px',
  cursor: 'pointer',
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: 6,
}

const landingMain = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '56px 24px',
}

const dashboardMain = {
  width: 'min(1440px, 100%)',
  margin: '0 auto',
  padding: 24,
  boxSizing: 'border-box',
}

const summaryBar = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 24,
  alignItems: 'flex-start',
  borderBottom: '1px solid #eee',
  paddingBottom: 18,
  marginBottom: 18,
}

const summaryStats = {
  display: 'flex',
  gap: 24,
  flexShrink: 0,
  textAlign: 'right',
}

const dashboardGrid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 420px)',
  gap: 18,
  alignItems: 'start',
}

const treePanel = {
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  padding: 14,
  background: '#fff',
  position: 'sticky',
  top: 16,
}

const errorBox = {
  padding: '12px 16px',
  background: '#fff5f5',
  border: '1px solid #fecaca',
  borderRadius: 8,
  color: '#dc2626',
  margin: '16px 0',
}

import { useState } from 'react'
import RepoInput from './components/RepoInput'
import DigestOutput from './components/DigestOutput'
import DirectoryTree from './components/DirectoryTree'
import RepoSummary from './components/RepoSummary'
import { fetchRepoTree, generateDigest } from './services/api'

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
      setError(err.response?.data?.error || 'Failed to fetch repo')
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
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#080808' }}>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid #eee',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff'
      }}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>RepoDigest</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RepoInput onSubmit={handleUrlSubmit} loading={loading} />
          {step === STEPS.DASHBOARD && (
            <button onClick={reset} style={{
              fontSize: 13,
              padding: '8px 14px',
              cursor: 'pointer',
              border: '1px solid #ddd',
              borderRadius: 6,
              background: '#f5fafa',
              whiteSpace: 'nowrap'
            }}>
              ← New repo
            </button>
          )}
        </div>
      </header>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 24px',
          background: '#fff5f5',
          borderBottom: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: 13
        }}>
          {error}
        </div>
      )}

      {/* Landing */}
      {step === STEPS.IDLE && (
        <div style={{ textAlign: 'center', padding: '120px 24px' }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
            Ingest any GitHub repo
          </h1>
          <p style={{ color: '#666', fontSize: 16, marginBottom: 0 }}>
            Paste a GitHub URL above and get an LLM-ready digest instantly.
          </p>
          {loading && (
            <p style={{ color: '#888', marginTop: 24, fontSize: 14 }}>
              Fetching repo and generating digest...
            </p>
          )}
        </div>
      )}

      {/* Dashboard */}
      {step === STEPS.DASHBOARD && treeData && digestResult && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 57px)' }}>

          {/* Summary bar */}
          <RepoSummary
            treeData={treeData}
            digestResult={digestResult}
          />

          {/* Two column layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            flex: 1,
            overflow: 'hidden'
          }}>

            {/* Left — Digest */}
            <div style={{
              borderRight: '1px solid #e5e5e5',
              overflowY: 'auto',
              padding: 24,
              background: '#fff'
            }}>
              <DigestOutput
                result={digestResult}
                owner={treeData.owner}
                repo={treeData.repo}
              />
            </div>

            {/* Right — Directory tree */}
            <div style={{
              overflowY: 'auto',
              padding: 16,
              background: '#d5e0e0'
            }}>
              <DirectoryTree files={treeData.files} />
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
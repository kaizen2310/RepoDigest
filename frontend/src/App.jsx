import { useState } from 'react'
import RepoInput from './components/RepoInput'
import FileTree from './components/FileTree'
import DigestOutput from './components/DigestOutput'
import { fetchRepoTree, generateDigest } from './services/api'

const STEPS = {
  IDLE: 'idle',
  TREE: 'tree',
  DIGEST: 'digest'
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
      const data = await fetchRepoTree(url)
      setTreeData(data)
      setStep(STEPS.TREE)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch repo')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate(selectedFiles) {
    setError('')
    setLoading(true)
    try {
      const result = await generateDigest({
        owner: treeData.owner,
        repo: treeData.repo,
        ref: treeData.ref,
        files: selectedFiles,
      })
      setDigestResult(result)
      setStep(STEPS.DIGEST)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate digest')
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
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #eee', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 18 }}>RepoDigest</span>
        {step !== STEPS.IDLE && (
          <button onClick={reset} style={{ fontSize: 13, padding: '5px 12px', cursor: 'pointer' }}>
            ← New repo
          </button>
        )}
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        {step === STEPS.IDLE && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 32, fontWeight: 600, marginBottom: 8 }}>
              Ingest any GitHub repo
            </h1>
            <p style={{ color: '#666', marginBottom: 32 }}>
              Paste a GitHub URL, select files, copy the digest into any LLM.
            </p>
            <RepoInput onSubmit={handleUrlSubmit} loading={loading} />
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', marginTop: 16 }}>
            {error}
          </div>
        )}

        {step === STEPS.TREE && treeData && (
          <FileTree
            files={treeData.files}
            meta={treeData.meta}
            owner={treeData.owner}
            repo={treeData.repo}
            ref={treeData.ref}
            onGenerate={handleGenerate}
            loading={loading}
          />
        )}

        {step === STEPS.DIGEST && digestResult && (
          <DigestOutput
            result={digestResult}
            owner={treeData.owner}
            repo={treeData.repo}
          />
        )}
      </main>
    </div>
  )
}
import { useState } from 'react'

const MODEL_LIMITS = {
  'GPT-4o': 128000,
  'Claude 3.5': 200000,
  'Gemini 1.5 Pro': 1000000,
  'GPT-3.5': 16000,
}

export default function DigestOutput({ result, owner, repo }) {
  const [copied, setCopied] = useState(false)
  const [selectedModel, setSelectedModel] = useState('Claude 3.5')

  function copyToClipboard() {
    navigator.clipboard.writeText(result.digest)
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
  }

  const limit = MODEL_LIMITS[selectedModel]
  const pct = Math.min(100, Math.round((result.tokenCount / limit) * 100))
  const overLimit = result.tokenCount > limit

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 24, padding: '14px 16px', background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: '8px 8px 0 0' }}>
        <Stat label="Files" value={result.fileCount} />
        <Stat label="Tokens" value={result.tokenCount?.toLocaleString()} />
        {result.fromCache && (
          <span style={{ fontSize: 12, color: '#888', alignSelf: 'center' }}>
            ● from cache
          </span>
        )}
      </div>

      {/* Token budget bar */}
      <div style={{ padding: '12px 16px', background: '#fff', border: '1px solid #e5e5e5', borderTop: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#666' }}>Context usage for</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{ fontSize: 12, border: '1px solid #ddd', borderRadius: 4, padding: '2px 6px' }}
          >
            {Object.keys(MODEL_LIMITS).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: overLimit ? '#dc2626' : '#666', fontWeight: 500 }}>
            {pct}% {overLimit ? '— exceeds limit!' : ''}
          </span>
        </div>
        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: overLimit ? '#dc2626' : pct > 80 ? '#f59e0b' : '#10b981',
            borderRadius: 3,
            transition: 'width 0.3s'
          }} />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: '#fff', border: '1px solid #e5e5e5', borderTop: 'none' }}>
        <button onClick={copyToClipboard} style={actionBtn}>
          {copied ? '✓ Copied!' : 'Copy to clipboard'}
        </button>
        <button onClick={downloadTxt} style={actionBtn}>
          Download .txt
        </button>
      </div>

      {/* Digest content */}
      <pre style={{
        margin: 0,
        padding: 20,
        background: '#111',
        color: '#e8e8e8',
        fontSize: 12,
        fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
        lineHeight: 1.6,
        maxHeight: 520,
        overflowY: 'auto',
        overflowX: 'auto',
        border: '1px solid #e5e5e5',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {result.digest}
      </pre>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{value}</div>
    </div>
  )
}

const actionBtn = {
  padding: '7px 14px',
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
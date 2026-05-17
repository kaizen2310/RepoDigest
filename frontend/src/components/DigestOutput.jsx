import { useState } from 'react'

const TOKEN_LIMIT = 300000

export default function DigestOutput({ result, owner, repo }) {
  const [copied, setCopied] = useState(false)

  const overLimit = result.tokenCount > TOKEN_LIMIT
  const pct = Math.min(100, Math.round((result.tokenCount / TOKEN_LIMIT) * 100))

  const displayDigest = overLimit
    ? result.digest.slice(0, 300000) + '\n\n... [truncated — download for full digest]'
    : result.digest

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Over limit warning */}
      {overLimit && (
        <div style={{
          padding: '10px 14px',
          background: '#fff5f5',
          border: '1px solid #fecaca',
          borderRadius: 6,
          color: '#dc2626',
          fontSize: 13,
          marginBottom: 12
        }}>
          ⚠️ This repo exceeds 300k tokens — digest is truncated for display.
          Use the download button to get the full digest.
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={copyToClipboard} style={primaryBtn}>
          {copied ? '✓ Copied!' : 'Copy to clipboard'}
        </button>
        <button onClick={downloadTxt} style={secondaryBtn}>
          Download full digest .txt
        </button>
      </div>

      {/* Token bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: '#666' }}>Token usage (300k limit)</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: overLimit ? '#dc2626' : '#666' }}>
            {result.tokenCount?.toLocaleString()} / 300,000 ({pct}%)
          </span>
        </div>
        <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: overLimit ? '#dc2626' : pct > 80 ? '#f59e0b' : '#10b981',
            borderRadius: 3,
          }} />
        </div>
      </div>

      {/* Digest content */}
      <pre style={{
        flex: 1,
        margin: 0,
        padding: 16,
        background: '#1b1b1b',
        color: '#dad2d2',
        fontSize: 12,
        fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
        lineHeight: 1.6,
        overflowY: 'auto',
        overflowX: 'auto',
        borderRadius: 8,
        whiteSpace: 'pre',
        wordBreak: 'normal',
        textAlign: 'left',
      }}>
        {displayDigest}
      </pre>

    </div>
  )
}

const primaryBtn = {
  padding: '8px 16px',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const secondaryBtn = {
  padding: '8px 16px',
  background: '#fff',
  color: '#1a1a1a',
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
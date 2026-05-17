export default function RepoSummary({ treeData, digestResult }) {
  const { owner, repo, ref, files, meta } = treeData
  const { tokenCount, fileCount } = digestResult

  const TOKEN_LIMIT = 300000
  const overLimit = tokenCount > TOKEN_LIMIT
  const pct = Math.min(100, Math.round((tokenCount / TOKEN_LIMIT) * 100))

  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #e5e5e5',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexWrap: 'wrap',
      fontSize: 13,
    }}>

      {/* Repo name */}
      <div>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{owner}/</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#444' }}>{repo}</span>
      </div>

      <Divider />

      {/* Branch */}
      <Pill label="Branch" value={ref} />

      {/* Total files in repo */}
      <Pill label="Total files" value={files.length} />

      {/* Files digested */}
      <Pill label="Digested" value={fileCount} />

      {/* Language */}
      {meta.language && <Pill label="Language" value={meta.language} />}

      {/* Stars */}
      {meta.stars && <Pill label="Stars" value={`★ ${meta.stars.toLocaleString()}`} />}

      <Divider />

      {/* Token count + bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#666' }}>Tokens:</span>
        <span style={{
          fontWeight: 600,
          color: overLimit ? '#dc2626' : '#111'
        }}>
          {tokenCount.toLocaleString()}
        </span>
        <div style={{ width: 80, height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: overLimit ? '#dc2626' : pct > 80 ? '#f59e0b' : '#10b981',
            borderRadius: 3,
          }} />
        </div>
        <span style={{ fontSize: 11, color: overLimit ? '#dc2626' : '#999' }}>
          {pct}% of 300k
        </span>
      </div>

      {/* Description */}
      {meta.description && (
        <>
          <Divider />
          <span style={{ color: '#666', fontStyle: 'italic', fontSize: 12 }}>
            {meta.description}
          </span>
        </>
      )}

    </div>
  )
}

function Pill({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <span style={{ color: '#999' }}>{label}:</span>
      <span style={{ fontWeight: 500, color: '#111' }}>{value}</span>
    </div>
  )
}

function Divider() {
  return (
    <div style={{ width: 1, height: 16, background: '#e5e5e5' }} />
  )
}
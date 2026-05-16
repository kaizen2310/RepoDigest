import { useState, useMemo } from 'react'

export default function FileTree({ files, meta, owner, repo, ref, onGenerate, loading }) {
  const [selected, setSelected] = useState(new Set(files))
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return files.filter((f) =>
      f.toLowerCase().includes(search.toLowerCase())
    )
  }, [files, search])

  function toggleFile(file) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(file) ? next.delete(file) : next.add(file)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filtered))
  }

  function clearAll() {
    setSelected(new Set())
  }

  const estimatedTokens = Math.ceil(selected.size * 200 / 4)

  return (
    <div>
      {/* Repo info strip */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontWeight: 600 }}>{owner}/{repo}</span>
        <span style={{ color: '#888', fontSize: 13, marginLeft: 10 }}>
          {ref} · {files.length} files
        </span>
        {meta.description && (
          <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
            {meta.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13, color: '#888' }}>
          {meta.language && <span>● {meta.language}</span>}
          {meta.stars && <span>★ {meta.stars.toLocaleString()}</span>}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Filter files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '7px 12px',
            fontSize: 13,
            border: '1px solid #ddd',
            borderRadius: 6,
            fontFamily: 'inherit',
          }}
        />
        <button onClick={selectAll} style={ghostBtn}>Select all</button>
        <button onClick={clearAll} style={ghostBtn}>Clear</button>
      </div>

      {/* File list */}
      <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, marginBottom: 16, maxHeight: 400, overflowY: 'auto' }}>
        {filtered.map((file) => (
          <label
            key={file}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              cursor: 'pointer',
              borderBottom: '1px solid #f5f5f5',
              background: selected.has(file) ? '#f9f9ff' : 'transparent',
              fontSize: 13,
              fontFamily: 'monospace',
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(file)}
              onChange={() => toggleFile(file)}
            />
            {file}
          </label>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#666' }}>
          {selected.size} of {files.length} files · ~{estimatedTokens.toLocaleString()} tokens
        </span>
        <button
          onClick={() => onGenerate([...selected])}
          disabled={loading || selected.size === 0}
          style={{
            padding: '9px 20px',
            background: selected.size === 0 || loading ? '#ccc' : '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: selected.size === 0 || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating...' : 'Generate digest'}
        </button>
      </div>
    </div>
  )
}

const ghostBtn = {
  padding: '7px 12px',
  background: '#f5f5f5',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
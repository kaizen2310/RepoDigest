import { useMemo, useState } from 'react'

export default function FileTree({ files, owner, repo, branchRef, onGenerate, loading }) {
  const [selected, setSelected] = useState(new Set(files))
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return files
    return files.filter((file) => file.toLowerCase().includes(needle))
  }, [files, search])

  function toggleFile(file) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(file) ? next.delete(file) : next.add(file)
      return next
    })
  }

  function selectVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      filtered.forEach((file) => next.add(file))
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(files))
  }

  function clearAll() {
    setSelected(new Set())
  }

  const estimatedTokens = Math.ceil(selected.size * 200 / 4)

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, margin: '0 0 4px', fontWeight: 700 }}>Project tree</h2>
        <div style={{ color: '#666', fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word' }}>
          {owner}/{repo}
          <br />
          {branchRef} - {files.length} files
        </div>
      </div>

      <input
        type="text"
        placeholder="Filter files..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchInput}
      />

      <div style={controlGrid}>
        <button onClick={selectAll} style={ghostBtn}>All</button>
        <button onClick={selectVisible} style={ghostBtn}>Visible</button>
        <button onClick={clearAll} style={ghostBtn}>Clear</button>
      </div>

      <div style={fileList}>
        {filtered.map((file) => (
          <label
            key={file}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '7px 10px',
              cursor: 'pointer',
              borderBottom: '1px solid #f3f3f3',
              background: selected.has(file) ? '#f8fafc' : 'transparent',
              fontSize: 12,
              fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
              lineHeight: 1.35,
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(file)}
              onChange={() => toggleFile(file)}
              style={{ marginTop: 1 }}
            />
            <span style={{ wordBreak: 'break-word' }}>{file}</span>
          </label>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#666' }}>
          {selected.size} selected - about {estimatedTokens.toLocaleString()} preview tokens
        </span>
        <button
          onClick={() => onGenerate([...selected])}
          disabled={loading || selected.size === 0}
          style={{
            padding: '10px 14px',
            background: selected.size === 0 || loading ? '#ccc' : '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: selected.size === 0 || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating...' : 'Generate selected digest'}
        </button>
      </div>
    </div>
  )
}

const searchInput = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  fontSize: 13,
  border: '1px solid #ddd',
  borderRadius: 6,
  fontFamily: 'inherit',
  marginBottom: 8,
}

const controlGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  marginBottom: 10,
}

const fileList = {
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  marginBottom: 12,
  maxHeight: 'calc(100vh - 330px)',
  minHeight: 280,
  overflowY: 'auto',
}

const ghostBtn = {
  padding: '7px 10px',
  background: '#f5f5f5',
  border: 'none',
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

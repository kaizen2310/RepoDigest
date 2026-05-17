import { useState } from 'react'

function buildTree(filePaths) {
  const tree = {}
  for (const filePath of filePaths) {
    const parts = filePath.split('/')
    let node = tree
    for (const part of parts) {
      if (!node[part]) node[part] = {}
      node = node[part]
    }
  }
  return tree
}

function renderTree(node, prefix = '') {
  const keys = Object.keys(node)
  return keys.map((key, i) => {
    const isLast = i === keys.length - 1
    const connector = isLast ? '└── ' : '├── '
    const childPrefix = prefix + (isLast ? '    ' : '│   ')
    const hasChildren = Object.keys(node[key]).length > 0
    const label = hasChildren ? key + '/' : key
    const childLines = hasChildren ? '\n' + renderTree(node[key], childPrefix) : ''
    return prefix + connector + label + childLines
  }).join('\n')
}

export default function DirectoryTree({ files }) {
  const [copied, setCopied] = useState(false)

  const tree = buildTree(files)
  const treeText = renderTree(tree)

  function copyTree() {
    navigator.clipboard.writeText(treeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Directory structure
        </span>
        <button onClick={copyTree} style={{
          fontSize: 11,
          padding: '4px 10px',
          background: copied ? '#10b981' : '#f0f0f0',
          color: copied ? '#fff' : '#333',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}>
          {copied ? '✓ Copied' : 'Copy tree'}
        </button>
      </div>

      {/* Tree */}
      <pre style={{
        flex: 1,
        margin: 0,
        padding: 12,
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 6,
        fontSize: 11,
        fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
        lineHeight: 1.6,
        overflowY: 'auto',
        whiteSpace: 'pre',
        textAlign:'left',
        color: '#333'
      }}>
        {treeText}
      </pre>

    </div>
  )
}
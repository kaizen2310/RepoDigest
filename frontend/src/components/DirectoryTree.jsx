import { useState } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { Copy } from "lucide-react"

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
  return keys.map((key, index) => {
    const isLast = index === keys.length - 1
    const connector = isLast ? '└── ' : '├── '
    const childPrefix = prefix + (isLast ? '    ' : '│   ')
    const hasChildren = Object.keys(node[key]).length > 0
    const label = hasChildren ? `${key}/` : key
    const childLines = hasChildren ? `\n${renderTree(node[key], childPrefix)}` : ''

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
    <Card className="min-h-[280px] border shadow-none">
      <CardContent className="flex h-full min-h-[280px] flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">
            Directory structure
          </span>
          <Button
            size="sm"
            variant={copied ? "default" : "secondary"}
            onClick={copyTree}
          >
            <Copy className="mr-1 h-3 w-3" />
            {copied ? 'Copied' : 'Copy tree'}
          </Button>
        </div>

        <pre className="flex-1 overflow-auto rounded-md border bg-muted p-3 text-left font-mono text-xs leading-6 text-foreground">
          {treeText}
        </pre>
      </CardContent>
    </Card>
  )
}

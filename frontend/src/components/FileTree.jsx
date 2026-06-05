import { useState, useMemo } from 'react'

import {
  Folder,
  FileText,
  Search,
  Sparkles,
  Star,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

import { Input } from "@/components/ui/input"

import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"

export default function FileTree({
  files,
  meta,
  owner,
  repo,
  ref,
  onGenerate,
  loading
}) {

  const [selected, setSelected] = useState(
    new Set(files)
  )

  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {

    return files.filter((f) =>
      f.toLowerCase().includes(
        search.toLowerCase()
      )
    )

  }, [files, search])

  function toggleFile(file) {

    setSelected((prev) => {

      const next = new Set(prev)

      next.has(file)
        ? next.delete(file)
        : next.add(file)

      return next

    })

  }

  function selectAll() {
    setSelected(new Set(filtered))
  }

  function clearAll() {
    setSelected(new Set())
  }

  const estimatedTokens = Math.ceil(
    selected.size * 200 / 4
  )

  return (

    <Card className="h-full">

      <CardContent className="flex h-full flex-col p-4">

        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-3">

          {/* Repo */}
          <div>

            <div className="flex items-center gap-2">

              <Folder className="h-5 w-5 text-muted-foreground" />

              <span className="text-lg font-bold tracking-tight">
                {owner}
                <span className="text-muted-foreground">
                  /{repo}
                </span>
              </span>

            </div>

            {meta.description && (

              <p className="mt-1 text-sm text-muted-foreground">
                {meta.description}
              </p>

            )}

          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">

            <Badge variant="secondary">
              {ref}
            </Badge>

            <Badge variant="outline">
              {files.length} files
            </Badge>

            {meta.language && (

              <Badge variant="outline">
                {meta.language}
              </Badge>

            )}

            {!!meta.stars && (

              <Badge variant="outline">
                <Star className="mr-1 h-3 w-3" />{meta.stars.toLocaleString()}
              </Badge>

            )}

          </div>

        </div>

        {/* SEARCH + CONTROLS */}
        <div className="mb-4 flex flex-col gap-2">

          {/* Search */}
          <div className="relative">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              type="text"
              placeholder="Filter files..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="pl-9"
            />

          </div>

          {/* Buttons */}
          <div className="flex gap-2">

            <Button
              size="sm"
              variant="secondary"
              onClick={selectAll}
            >
              Select all
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={clearAll}
            >
              Clear
            </Button>

          </div>

        </div>

        {/* FILE LIST */}
        <div className="mb-4 flex-1 overflow-auto rounded-lg border bg-background">

          {filtered.map((file) => (

            <label
              key={file}
              className={`flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                selected.has(file)
                  ? 'bg-muted'
                  : ''
              }`}
            >

              <input
                type="checkbox"
                checked={selected.has(file)}
                onChange={() => toggleFile(file)}
                className="h-4 w-4"
              />

              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

              <span className="truncate font-mono">
                {file}
              </span>

            </label>

          ))}

        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-3 border-t pt-4">

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">

            <span className="text-muted-foreground">

              {selected.size} of {files.length} files selected

            </span>

            <span className="font-medium">

              ~{estimatedTokens.toLocaleString()} tokens

            </span>

          </div>

          {/* Generate button */}
          <Button
            onClick={() => onGenerate([...selected])}
            disabled={loading || selected.size === 0}
            className="w-full"
          >

            <Sparkles className="mr-2 h-4 w-4" />

            {loading
              ? 'Generating...'
              : 'Generate Digest'
            }

          </Button>

        </div>

      </CardContent>

    </Card>

  )

}

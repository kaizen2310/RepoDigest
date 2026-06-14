import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RepoInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim()) return setError('Please enter a URL')
    if (!url.includes('github.com')) return setError('Please enter a valid GitHub URL')
    setError('')
    onSubmit(url.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mx-auto flex w-full max-w-2xl gap-2">
        <Input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError('') }}
          placeholder="https://github.com/owner/repo"
          disabled={loading}
          className={`h-10 flex-1 text-sm ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />
        <Button
          type="submit"
          disabled={loading || !url.trim()}
          className="h-10 px-5 shrink-0"
        >
          {loading ? 'Fetching...' : 'Fetch repo'}
        </Button>
      </div>
      {error && (
        <p className="mt-1.5 text-center text-xs text-destructive">{error}</p>
      )}
    </form>
  )
}
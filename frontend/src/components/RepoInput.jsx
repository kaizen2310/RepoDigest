import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RepoInput({ onSubmit, loading }) {
    const [url ,setUrl] = useState('')
    const [error ,setError] = useState('')

    function handleSubmit(e) {
        e.preventDefault()

        if (!url.trim()) {
            setError('Please enter URL')
            return
        }

        if (!url.includes('github.com')) {
            setError('Please enter a valid GitHub URL')
            return
        }

        setError('')
        onSubmit(url.trim())
    }

    return (
  <form onSubmit={handleSubmit}>
    
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-3 sm:flex-row">
      
      <Input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://github.com/owner/repo"
        disabled={loading}
        className={`h-11 min-w-0 flex-1 text-sm ${
          error ? 'border-red-500 focus-visible:ring-red-500' : ''
        }`}
      />

      <Button
        type="submit"
        disabled={loading || !url.trim()}
        className="h-11 px-5 sm:w-auto"
      >
        {loading ? 'Fetching...' : 'Fetch repo'}
      </Button>

    </div>

    {error && (
      <p className="mt-2 text-sm text-red-600">
        {error}
      </p>
    )}

  </form>
)
}   

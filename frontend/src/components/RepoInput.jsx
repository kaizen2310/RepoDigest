import { useState } from 'react';

export default function RepoInput({onSubmit , loading}) {
    const [url ,setUrl] = useState('')
    const [error ,setError] = useState('')

    function handleSubmit(e) {
        e.preventDefault()

        if(!url.trim()) {
            setError('Please enter URL')
            return
        }

        if(!url.includes('github.com')){
            setError('Please enter valid Github URL')
            return
        }

        setError('')
        onSubmit(url.trim())
    }

    return(
        <form onSubmit={handleSubmit}>
            <div style={{display : 'flex' , gap: 8, maxWidth :600, margin:'0 auto'}}>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    disabled={loading}
                    style={{
                        flex : 1,
                        padding :'10px 14px',
                        fontSize :15,
                        border : error? '1.5px solid #dc2626' : '1px solid #ddd',
                        borderRadius : 8,
                        outline : 'none',
                        fontFamily : 'inherit'
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    style={{
                        padding: '10px 20px',
                        background: loading ? '#ccc' : '#1a1a1a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Fetching...' : 'Fetch repo'}
                </button>
            </div>
            
            {error && (
                <p style={{color : '#dc2626', fontSize:13,marginTop:8}}>
                    {error}
                </p>
            )}
        </form>
    )
}   

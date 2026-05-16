import axios from 'axios'

const api = axios.create({
    baseURL :'http://localhost:5000/api'
}) 


export async function fetchRepoTree(url) {
    const {data} = await api.post('/digest/tree' ,{url})
    return data
}


export async function generateDigest({owner,repo,ref,files}) {
    const {data} = await api.post('/digest/generate',{owner,repo,ref,files})
    return data
}

export async function fetchDigestById(id) {
  const { data } = await api.get(`/digest/${id}`)
  return data
}
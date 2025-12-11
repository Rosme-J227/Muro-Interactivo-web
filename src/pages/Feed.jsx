import React, { useEffect, useState } from 'react'
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import { listPosts } from '../services/postsService'
import toast from 'react-hot-toast'

export default function Feed(){
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadMoreFn, setLoadMoreFn] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(()=>{
    const res = listPosts((newPosts)=>{
      setPosts(newPosts)
      setLoading(false)
    }, 10, (err)=>{
      console.error('Feed listPosts error', err)
      toast.error('No se pueden cargar los posts: ' + (err?.message||err?.code||'error'))
      setLoading(false)
    })
    // store loadMore function
    if(res && res.loadMore) setLoadMoreFn(() => res.loadMore)
    return ()=> res && res.unsub && res.unsub()
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <CreatePost />
      {loading ? <p>Cargando posts...</p> : posts.length === 0 ? <p>No hay posts aún.</p> : posts.map(p => <PostCard key={p.id} post={p} />)}
      {loadMoreFn && !loading && (
        <div className="flex justify-center mt-4">
          <button onClick={async ()=>{
            setLoadingMore(true)
            try{
              const more = await loadMoreFn()
              if(more && more.length) setPosts(prev => [...prev, ...more])
            }catch(e){ console.error('Load more error', e) }
            setLoadingMore(false)
          }} className="px-4 py-2 bg-gray-200 rounded">{loadingMore ? 'Cargando...' : 'Cargar más'}</button>
        </div>
      )}
    </div>
  )
}

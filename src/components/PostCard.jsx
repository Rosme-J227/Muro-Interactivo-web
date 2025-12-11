import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import useAuth from '../store/useAuth'
import { hasUserLiked, toggleLike } from '../services/postsService'
import toast from 'react-hot-toast'
dayjs.extend(relativeTime)

function stringToColor(str){
  if(!str) return '#7C3AED'
  let hash = 0
  for(let i=0;i<str.length;i++){ hash = str.charCodeAt(i) + ((hash<<5)-hash) }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase()
  return `#${'00000'.substring(0,6-c.length)+c}`
}

export default function PostCard({post}){
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [likeProcessing, setLikeProcessing] = useState(false)

  useEffect(()=>{
    let mounted = true
    async function check(){
      if(user){
        const res = await hasUserLiked(post.id, user.uid)
        if(mounted) setLiked(res)
      }else{
        if(mounted) setLiked(false)
      }
    }
    check()
    return ()=> mounted = false
  }, [user, post.id])

  const handleLike = async () => {
    if(!user){ toast.error('Inicia sesión para dar like'); return }
    if(likeProcessing) return
    setLikeProcessing(true)
    // optimistic UI
    const prevLiked = liked
    const prevCount = likesCount
    setLiked(!prevLiked)
    setLikesCount(c => prevLiked ? c - 1 : c + 1)

    // try toggle with retries
    const maxAttempts = 3
    let attempt = 0
    let succeeded = false
    let lastError = null
    while(attempt < maxAttempts && !succeeded){
      try{
        const res = await toggleLike(post.id, user.uid, post.authorId)
        // sync UI to server result
        setLiked(res.liked)
        setLikesCount(c => res.liked ? Math.max(prevCount + 1, c) : Math.max(prevCount - 1, 0))
        succeeded = true
        break
      }catch(e){
        lastError = e
        attempt += 1
        // small delay before retry
        await new Promise(r => setTimeout(r, 600))
      }
    }
    if(!succeeded){
      // revert optimistic change
      setLiked(prevLiked)
      setLikesCount(prevCount)
      console.error('Like error', lastError)
      toast.error(lastError?.message || 'Error al dar like')
    }
    setLikeProcessing(false)
  }

  return (
    <article className="bg-white post-card mb-4 fade-in">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="avatar small" style={{background: `linear-gradient(135deg, ${stringToColor(post.authorName||post.author||'U')}, #7C3AED)`}}>
            {(post.authorName || post.author || 'U').split(' ').map(x=>x[0]).slice(0,2).join('')}
          </div>
          <div>
            <h3 className="font-semibold">{post.authorName || post.author}</h3>
            <p className="text-xs text-gray-500">{post.createdAt ? dayjs(post.createdAt?.toDate?.() || post.createdAt).fromNow() : dayjs().format('DD/MM/YYYY')}</p>
          </div>
        </div>
      </div>
      <p className="mt-3">{post.content}</p>
      {post.mediaUrl && <img loading="lazy" src={post.mediaUrl} alt="media" className="mt-3 max-h-80 object-cover w-full rounded" />}
      <div className="mt-4 flex gap-4 text-sm text-gray-600 items-center">
        <button onClick={handleLike} className={`flex items-center gap-2 btn-large btn-ghost ${liked ? 'text-blue-600' : 'text-gray-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className="inline-block">
            <path d="M12 21s-7-4.35-9.33-7.02C-0.03 10.9 2.1 6 6 6c2.21 0 3.5 1.12 4 2 .5-.88 1.79-2 4-2 3.9 0 6.03 4.9 3.33 7.98C19 16.65 12 21 12 21z" />
          </svg>
          <span>{likesCount}</span>
        </button>
        <Link to={`/post/${post.id}`} className="hover:underline text-sm text-purple-800">Ver</Link>
        <span className="text-sm text-gray-500">·</span>
        <span className="text-sm text-gray-600">{post.commentsCount || 0} comentarios</span>
      </div>
    </article>
  )
}

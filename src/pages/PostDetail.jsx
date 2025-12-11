import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPostById, deletePostById, updatePostById } from '../services/postsService'
import toast from 'react-hot-toast'
import useAuth from '../store/useAuth'
import dayjs from 'dayjs'
import { addComment, listComments, deleteComment } from '../services/commentsService'

export default function PostDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')
  const [newFile, setNewFile] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')

  useEffect(()=>{
    let mounted = true
    async function load(){
      const p = await getPostById(id)
      if(mounted) setPost(p)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [id])

  useEffect(()=>{
    const unsub = listComments(id, (c)=> setComments(c))
    return ()=> unsub && unsub()
  }, [id])

  const handleDelete = async () => {
    if(!user) return
    if(post?.authorId !== user.uid){ return }
    try{
      // navigate immediately and attempt delete (optimistic UX)
      nav('/')
      toast.success('Post eliminado')
      await deletePostById(id)
    }catch(e){ console.error(e) }
  }

  const handleEditToggle = () => {
    setEditing(!editing)
    setContent(post?.content || '')
  }

  const handleUpdate = async () => {
    if(!user || user.uid !== post.authorId) return
    try{
      const payload = { content }
      if(newFile) payload.newFile = newFile
      await updatePostById(id, payload)
      const refreshed = await getPostById(id)
      setPost(refreshed)
      setEditing(false)
      setNewFile(null)
      toast.success('Post actualizado')
    }catch(e){ console.error(e) }
  }

  const handleAddComment = async () => {
    if(!user) return
    if(!commentText.trim()) return
    const textToSend = commentText.trim()
    try{
      await addComment(id, { authorId: user.uid, authorName: user.displayName || user.email, text: textToSend })
      setCommentText('')
      toast.success('Comentario agregado')
      // refresh post to reflect updated commentsCount
      try{
        const refreshed = await getPostById(id)
        if(refreshed) setPost(refreshed)
      }catch(e){ console.warn('Could not refresh post after comment', e) }
    }catch(e){
      console.error(e)
      toast.error('No se pudo publicar el comentario')
    }
  }

  const handleDeleteComment = async (commentId, commentAuthorId) => {
    if(!user) return
    if(user.uid !== commentAuthorId && user.uid !== post.authorId) return
    try{
      await deleteComment(id, commentId)
      toast.success('Comentario eliminado')
      // refresh post commentsCount
      try{ const refreshed = await getPostById(id); if(refreshed) setPost(refreshed) }catch(e){ console.warn('Could not refresh post after deleting comment', e) }
    }catch(e){ console.error(e) }
  }

  if(loading) return <p>Cargando...</p>
  if(!post) return <p>Post no encontrado.</p>

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">{post.authorName || 'Autor'}</h2>
      <p className="text-xs text-gray-500">{post.createdAt ? dayjs(post.createdAt?.toDate?.() || post.createdAt).format('DD/MM/YYYY HH:mm') : ''}</p>
      <div className="mt-4">
        {!editing ? (
          <>
            <p>{post.content}</p>
            {post.mediaUrl && <img src={post.mediaUrl} alt="media" className="mt-3 max-h-96 w-full object-cover rounded" />}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea value={content} onChange={(e)=>setContent(e.target.value)} className="p-2 border rounded" rows={4} />
            <input type="file" onChange={(e)=> setNewFile(e.target.files?.[0] || null)} accept="image/*" />
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="bg-blue-600 text-white px-3 py-1 rounded">Guardar</button>
              <button onClick={()=>{ setEditing(false); setNewFile(null) }} className="px-3 py-1 border rounded">Cancelar</button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        {user && user.uid === post.authorId && (
          <>
            <button onClick={handleEditToggle} className="bg-yellow-500 text-white px-3 py-1 rounded">{editing ? 'Editar' : 'Editar post'}</button>
            <button onClick={handleDelete} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar post</button>
          </>
        )}
      </div>

      <section className="mt-6">
        <h3 className="font-semibold mb-2">Comentarios</h3>
        {user ? (
          <div className="mb-3 flex gap-2">
            <input value={commentText} onChange={(e)=>setCommentText(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Escribe un comentario..." />
            <button onClick={handleAddComment} className="bg-blue-600 text-white px-3 py-1 rounded">Comentar</button>
          </div>
        ) : <p className="text-sm text-gray-500">Inicia sesión para comentar.</p>}

        {comments.length === 0 ? <p className="text-sm text-gray-500">No hay comentarios.</p> : (
          <div className="flex flex-col gap-2">
            {comments.map(c => (
              <div key={c.id} className="p-2 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold">{c.authorName}</div>
                    <div className="text-xs text-gray-500">{c.createdAt?.toDate ? dayjs(c.createdAt.toDate()).fromNow() : ''}</div>
                  </div>
                  {(user && (user.uid === c.authorId || user.uid === post.authorId)) && (
                    <button onClick={()=>handleDeleteComment(c.id, c.authorId)} className="text-red-500 text-sm">Eliminar</button>
                  )}
                </div>
                <p className="mt-2">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

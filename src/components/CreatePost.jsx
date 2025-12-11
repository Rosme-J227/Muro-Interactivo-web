import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import useAuth from '../store/useAuth'
import { createPost } from '../services/postsService'

export default function CreatePost(){
  const { user } = useAuth()
  const { register, handleSubmit, reset } = useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    if(!user){ toast.error('Debes iniciar sesión'); return }
    setLoading(true)
    try{
      let file = data.media?.[0] || null
      // If image file is large, resize client-side to speed upload
      if(file && file.type?.startsWith('image/')){
        try{
          file = await resizeImage(file, 1200)
        }catch(e){ console.warn('Image resize failed, uploading original', e) }
      }
      // add timeout so UI doesn't stay stuck if network/storage hangs
      const createPromise = createPost({
        content: data.content,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        file
      })
      const res = await Promise.race([
        createPromise,
        new Promise((_, rej) => setTimeout(()=> rej(new Error('timeout')), 20000))
      ])
      console.log('createPost result', res)
      // if backend didn't return an id, consider it failed
      if(!res || !res.id){
        toast.error('No se pudo guardar el post en el servidor')
      }else{
        reset()
        toast.success('Post creado')
      }
    }catch(e){
      console.error('Error creando post', e)
      toast.error(e.message || 'Error creando post')
    }finally{ setLoading(false) }
  }

  // client-side image resize helper
  function resizeImage(file, maxWidth){
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if(!blob) { URL.revokeObjectURL(url); return reject(new Error('No blob')) }
          const newFile = new File([blob], file.name, { type: blob.type })
          URL.revokeObjectURL(url)
          resolve(newFile)
        }, 'image/jpeg', 0.8)
      }
      img.onerror = (e)=>{ URL.revokeObjectURL(url); reject(e) }
      img.src = url
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded shadow mb-6 nice-section">
      <div className="flex gap-4 items-start">
        <div className="avatar" style={{background:'linear-gradient(135deg,#60A5FA,#7C3AED)'}}>TU</div>
        <div className="flex-1">
          <textarea {...register('content', { required: true })} placeholder="¿Qué estás pensando?" className="w-full input-large create-textarea border mb-3" rows="4"></textarea>
          <div className="flex items-center gap-3">
            <input type="file" {...register('media')} accept="image/*" />
            <div className="ml-auto">
              <button disabled={loading} className="btn-primary btn-large">{loading ? 'Publicando...' : 'Publicar'}</button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

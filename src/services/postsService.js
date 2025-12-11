import { db, storage } from '../firebase'
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc, deleteDoc, updateDoc, setDoc, increment, runTransaction, limit, startAfter, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export async function createPost({content, authorId, authorName, file}){
  let mediaUrl = null
  let mediaPath = null
  if(file){
    mediaPath = `posts/${Date.now()}_${file.name}`
    const storageRef = ref(storage, mediaPath)
    await uploadBytes(storageRef, file)
    mediaUrl = await getDownloadURL(storageRef)
  }
  const docRef = await addDoc(collection(db, 'posts'), {
    content,
    authorId,
    authorName,
    mediaUrl,
    mediaPath,
    createdAt: serverTimestamp(),
    likesCount: 0,
    commentsCount: 0
  })
  // try to read back the created document to confirm write
  try{
    const snap = await getDoc(docRef)
    if(!snap.exists()) return docRef
    return { id: snap.id, ...snap.data() }
  }catch(e){
    console.warn('createPost: could not read back created doc', e)
    return docRef
  }
}

export async function hasUserLiked(postId, userId){
  if(!userId) return false
  const d = doc(db, 'posts', postId, 'likes', userId)
  try{
    const snap = await getDoc(d)
    return snap.exists()
  }catch(e){
    console.warn('hasUserLiked error', e)
    return false
  }
}

export async function toggleLike(postId, userId, postAuthorId){
  if(!userId) throw new Error('Auth required')
  const likeRef = doc(db, 'posts', postId, 'likes', userId)
  const postRef = doc(db, 'posts', postId)
  try{
    const snap = await getDoc(likeRef)
    if(snap.exists()){
      // remove like
      await deleteDoc(likeRef)
      await updateDoc(postRef, { likesCount: increment(-1) })
      return { liked: false }
    }else{
      // add like
      await setDoc(likeRef, { createdAt: serverTimestamp() })
      await updateDoc(postRef, { likesCount: increment(1) })
      // create notification for post author
      try{
        if(postAuthorId && postAuthorId !== userId){
          await addDoc(collection(db, 'users', postAuthorId, 'notifications'), {
            type: 'like',
            postId,
            from: userId,
            createdAt: serverTimestamp(),
            read: false
          })
        }
      }catch(e){ console.warn('notification error', e) }
      return { liked: true }
    }
  }catch(e){
    console.error('toggleLike error', e)
    // if it's a transient network error, surface a friendly message
    if(e?.code === 'unavailable' || (e?.message && e.message.toLowerCase().includes('network'))){
      throw new Error('No hay conexión de red. Intenta de nuevo.')
    }
    throw new Error(e?.message || 'Error al procesar like')
  }
}

export async function getPostById(id){
  try{
    const d = doc(db, 'posts', id)
    const snap = await getDoc(d)
    if(!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  }catch(e){
    console.error('getPostById error', e)
    throw e
  }
}

export async function deletePostById(id){
  const d = doc(db, 'posts', id)
  // Use transaction to ensure read-before-delete
  try{
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(d)
      if(!snap.exists()) return
      const data = snap.data()
      // delete storage object outside transaction
      if(data?.mediaPath){
        try{ await deleteObject(ref(storage, data.mediaPath)) }catch(e){ console.warn('Error deleting storage object', e) }
      }
      tx.delete(d)
    })
  }catch(e){
    console.error('Transaction failed deleting post', e)
    // fallback: try direct delete
    const snap = await getDoc(d)
    if(snap.exists()){
      const data = snap.data()
      if(data?.mediaPath){ try{ await deleteObject(ref(storage, data.mediaPath)) }catch(e){ console.warn('Error deleting storage object', e) } }
      await deleteDoc(d)
    }
  }
}

export async function updatePostById(id, data){
  const d = doc(db, 'posts', id)
  // if replacing file: caller should provide { newFile }
  if(data.newFile){
    // upload new file first
    const file = data.newFile
    const mediaPath = `posts/${Date.now()}_${file.name}`
    const storageRef = ref(storage, mediaPath)
    await uploadBytes(storageRef, file)
    const mediaUrl = await getDownloadURL(storageRef)
    // perform transaction: delete old media (if any) and update doc
    try{
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(d)
        if(!snap.exists()) throw new Error('Post not found')
        const old = snap.data()
        tx.update(d, { content: data.content ?? old.content, mediaUrl, mediaPath, updatedAt: serverTimestamp() })
        // delete old storage after transaction
        if(old?.mediaPath){
          try{ await deleteObject(ref(storage, old.mediaPath)) }catch(e){ console.warn('Error deleting old media', e) }
        }
      })
    }catch(e){
      console.error('Transaction failed updating post with new file', e)
      // attempt fallback update
      await updateDoc(d, { ...data, mediaUrl, mediaPath, updatedAt: serverTimestamp() })
    }
  }else{
    await updateDoc(d, { ...data, updatedAt: serverTimestamp() })
  }
}

export function listPosts(onUpdate, pageSize = 10, onError){
  let lastDoc = null
  const q = query(collection(db, 'posts'), orderBy('createdAt','desc'), limit(pageSize))
  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    lastDoc = snap.docs[snap.docs.length - 1] || null
    onUpdate(data)
  }, (err) => {
    console.error('listPosts snapshot error', err)
    if(typeof onError === 'function') onError(err)
  })

  async function loadMore(){
    if(!lastDoc) return []
    const q2 = query(collection(db, 'posts'), orderBy('createdAt','desc'), startAfter(lastDoc), limit(pageSize))
    const snap = await getDocs(q2)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    if(snap.docs.length) lastDoc = snap.docs[snap.docs.length - 1]
    return data
  }

  return { unsub, loadMore }
}

import { db } from '../firebase'
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, increment } from 'firebase/firestore'

export async function addComment(postId, { authorId, authorName, text }){
  const col = collection(db, 'posts', postId, 'comments')
  const docRef = await addDoc(col, {
    authorId,
    authorName,
    text,
    createdAt: serverTimestamp()
  })
  // increment commentsCount on post
  try{
    const postRef = doc(db, 'posts', postId)
    await updateDoc(postRef, { commentsCount: increment(1) })
  }catch(e){ console.warn('Error incrementing commentsCount', e) }
  return docRef
}

export function listComments(postId, onUpdate){
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt','asc'))
  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    onUpdate(data)
  })
  return unsub
}

export async function deleteComment(postId, commentId){
  const d = doc(db, 'posts', postId, 'comments', commentId)
  await deleteDoc(d)
  // decrement commentsCount (best-effort)
  try{
    const postRef = doc(db, 'posts', postId)
    await updateDoc(postRef, { commentsCount: increment(-1) })
  }catch(e){ console.warn('Error decrementing commentsCount', e) }
}

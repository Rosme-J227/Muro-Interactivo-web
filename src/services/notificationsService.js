import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore'

export function listNotifications(userId, onUpdate){
  if(!userId) return () => {}
  const q = query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt','desc'))
  const unsub = onSnapshot(q, (snap)=>{
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    onUpdate(data)
  })
  return unsub
}

export async function markNotificationRead(userId, notificationId){
  const d = doc(db, 'users', userId, 'notifications', notificationId)
  await updateDoc(d, { read: true })
}

export async function deleteAllNotifications(userId){
  const col = collection(db, 'users', userId, 'notifications')
  const snaps = await getDocs(col)
  const deletes = snaps.docs.map(d => deleteDoc(doc(db, 'users', userId, 'notifications', d.id)))
  await Promise.all(deletes)
}

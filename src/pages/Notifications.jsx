import React, { useEffect, useState } from 'react'
import useAuth from '../store/useAuth'
import { listNotifications, markNotificationRead, deleteAllNotifications } from '../services/notificationsService'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

export default function Notifications(){
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])

  useEffect(()=>{
    if(!user) return
    const unsub = listNotifications(user.uid, (data)=> setNotifications(data))
    return ()=> unsub && unsub()
  }, [user])

  const handleMarkRead = async (id) => {
    try{ await markNotificationRead(user.uid, id); toast.success('Marcado como leído') }catch(e){ console.error(e); toast.error('Error') }
  }

  const handleMarkAllRead = async () => {
    try{
      const unread = notifications.filter(n => !n.read)
      await Promise.all(unread.map(n => markNotificationRead(user.uid, n.id)))
      toast.success('Todas marcadas')
    }catch(e){ console.error(e); toast.error('Error') }
  }

  const handleDeleteAll = async () => {
    if(!confirm('¿Borrar todas las notificaciones?')) return
    try{
      await deleteAllNotifications(user.uid)
      toast.success('Notificaciones eliminadas')
    }catch(e){ console.error(e); toast.error('Error al borrar') }
  }

  if(!user) return <p className="max-w-2xl mx-auto">Inicia sesión para ver notificaciones.</p>

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notificaciones</h2>
        <div className="flex gap-2">
          <button onClick={handleMarkAllRead} className="text-sm px-3 py-1 border rounded">Marcar todo leído</button>
          <button onClick={handleDeleteAll} className="text-sm px-3 py-1 border rounded text-red-600">Borrar todas</button>
        </div>
      </div>
      {notifications.length === 0 ? <p className="text-sm text-gray-500">No hay notificaciones.</p> : (
        <div className="flex flex-col gap-2">
          {notifications.map(n => (
            <div key={n.id} className={`p-2 rounded ${n.read ? 'bg-gray-50' : 'bg-white border'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold">{n.type === 'like' ? 'Nuevo like' : 'Notificación'}</div>
                  <div className="text-xs text-gray-500">{dayjs(n.createdAt?.toDate?.() || n.createdAt).fromNow ? dayjs(n.createdAt?.toDate?.() || n.createdAt).fromNow() : ''}</div>
                </div>
                {!n.read && <button onClick={()=>handleMarkRead(n.id)} className="text-xs text-blue-600">Marcar leído</button>}
              </div>
              <div className="mt-2 text-sm text-gray-700">{n.type === 'like' ? `Alguien le gustó tu post.` : JSON.stringify(n)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

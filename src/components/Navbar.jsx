import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../store/useAuth'
import { FiLogOut, FiUser, FiBell } from 'react-icons/fi'
import { listNotifications } from '../services/notificationsService'

export default function Navbar(){
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([])
  const nav = useNavigate()

  const handleLogout = async () => {
    await logout()
    nav('/')
  }

  useEffect(()=>{
    if(!user) return
    const unsub = listNotifications(user.uid, (data)=> setNotifications(data))
    return ()=> unsub && unsub()
  }, [user])

  return (
    <header className="mb-4">
      <div className="flex justify-between items-center p-3 bg-[--nav] rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm text-purple-800 font-medium">Fedd</Link>
          </nav>
        </div>
        <nav className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 text-base text-purple-900">
                <FiUser /> <span className="hidden sm:inline">{user.displayName || user.email}</span>
              </Link>
              <Link to="/notifications" className="relative text-base text-purple-900">
                <FiBell />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">{notifications.filter(n => !n.read).length}</span>
                )}
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded">
                <FiLogOut /> Salir
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="px-4 py-2 bg-blue-300 text-white rounded">Iniciar sesión</Link>
              <Link to="/register" className="px-4 py-2 bg-green-300 text-white rounded">Registrarse</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import PostDetail from './pages/PostDetail'
import Navbar from './components/Navbar'
import Notifications from './pages/Notifications'

export default function App(){
  return (
    <div className="min-h-screen relative bg-[--bg]" style={{backgroundColor:'var(--bg)'}}>
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-3 relative p-6">
            <h1 className="text-4xl font-serif hero-title">MURO<br/>INTERACTIVO</h1>
            <p className="text-lg text-purple-600 mt-3">Expresa todo lo que tengas que decir</p>
            <div className="mt-6">
              <img src="/Imagenes/PersonasHablando.png" alt="personas" className="sidebar-image w-72 rounded-lg shadow-2xl" />
              <div className="mt-4 text-sm text-purple-700">Comparte tus ideas y conecta con otros</div>
            </div>
          </aside>

          <div className="col-span-9">
            <Navbar />
            <main className="p-4">
              <Routes>
                <Route path="/" element={<Feed />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/post/:id" element={<PostDetail />} />
              </Routes>
            </main>
            <footer className="text-center p-4 text-sm text-gray-500">Muro Interactivo • Proyecto</footer>
          </div>
        </div>
      </div>
      {/* centered pensamiento decorative image at bottom */}
      <img src="/Imagenes/pensamiento.png" alt="pensando" className="pensamiento-main" />
    </div>
  )
}

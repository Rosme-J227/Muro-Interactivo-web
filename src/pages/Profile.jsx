import React, { useState } from 'react'
import useAuth from '../store/useAuth'
import { updateUserProfile, updateUserEmail } from '../services/authService'
import toast from 'react-hot-toast'
import { updateUserPassword } from '../services/authService'

export default function Profile(){
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const nameParts = (user?.displayName || '').split(' ')
  const [firstName, setFirstName] = useState(nameParts.slice(0, -1).join(' ') || nameParts[0] || '')
  const [lastName, setLastName] = useState(nameParts.slice(-1).join(' ') || '')
  const [email, setEmail] = useState(user?.email || '')
  const [photoFile, setPhotoFile] = useState(null)
  const [passwordForReauth, setPasswordForReauth] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if(!user) return <p>Debes iniciar sesión</p>

  const handleSaveProfile = async () => {
    setLoading(true)
    try{
      const displayName = (firstName + ' ' + lastName).trim()
      await updateUserProfile({ displayName, photoFile })
      toast.success('Perfil actualizado')
      setPhotoFile(null)
      setEditing(false)
    }catch(e){
      console.error('Update profile error', e)
      toast.error(e.message || 'Error al actualizar perfil')
    }finally{ setLoading(false) }
  }

  const handleChangeEmail = async () => {
    if(email === user.email){ toast('No hay cambios en el email'); return }
    if(!passwordForReauth){ toast.error('Ingresa tu contraseña para confirmar el cambio'); return }
    setLoading(true)
    try{
      await updateUserEmail(email, passwordForReauth)
      toast.success('Email actualizado')
      setPasswordForReauth('')
      setEditing(false)
    }catch(e){ console.error('Update email error', e); toast.error(e.message || 'Error al actualizar email') }
    finally{ setLoading(false) }
  }

  const handleChangePassword = async () => {
    if(!passwordForReauth) { toast.error('Ingresa tu contraseña actual'); return }
    if(!newPassword || newPassword.length < 6){ toast.error('La nueva contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try{
      await updateUserPassword(passwordForReauth, newPassword)
      toast.success('Contraseña actualizada')
      setPasswordForReauth('')
      setNewPassword('')
      setEditing(false)
    }catch(e){ console.error('Update password error', e); toast.error(e.message || 'Error al actualizar contraseña') }
    finally{ setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Perfil</h2>
        <button onClick={()=>setEditing(!editing)} className="px-3 py-1 border rounded">{editing ? 'Cancelar' : 'Editar'}</button>
      </div>

      {!editing ? (
        <div>
          <p><strong>Nombre:</strong> {user.displayName || user.email}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {user.photoURL && <img src={user.photoURL} alt="avatar" className="mt-3 w-24 h-24 object-cover rounded-full" />}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col">
            Nombre
            <input value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="p-2 border rounded mt-1" />
          </label>
          <label className="flex flex-col">
            Apellido
            <input value={lastName} onChange={(e)=>setLastName(e.target.value)} className="p-2 border rounded mt-1" />
          </label>
          <label className="flex flex-col">
            Email
            <input value={email} onChange={(e)=>setEmail(e.target.value)} className="p-2 border rounded mt-1" />
          </label>
          <label className="flex flex-col">
            Foto de perfil
            <input type="file" onChange={(e)=> setPhotoFile(e.target.files?.[0] || null)} accept="image/*" className="mt-1" />
          </label>

          <div className="flex gap-2">
            <button onClick={handleSaveProfile} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Guardando...' : 'Guardar perfil'}</button>
            <button onClick={handleChangeEmail} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">{loading ? 'Procesando...' : 'Cambiar email'}</button>
          </div>
          <label className="flex flex-col mt-2">
            Ingresa tu contraseña actual (requerido para cambiar email/contraseña)
            <input type="password" value={passwordForReauth} onChange={(e)=>setPasswordForReauth(e.target.value)} className="p-2 border rounded mt-1" />
          </label>

          <label className="flex flex-col mt-2">
            Nueva contraseña
            <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="p-2 border rounded mt-1" />
          </label>

          <div className="flex gap-2">
            <button onClick={handleChangePassword} disabled={loading} className="bg-orange-600 text-white px-4 py-2 rounded">{loading ? 'Procesando...' : 'Cambiar contraseña'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

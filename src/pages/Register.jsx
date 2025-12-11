import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { signUp } from '../services/authService'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const { register, handleSubmit, reset } = useForm()
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const onSubmit = async (data) => {
    if(data.password.length < 6){ toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try{
      await signUp(data.email, data.password, data.firstName + ' ' + data.lastName)
      toast.success('Cuenta creada')
      reset()
      nav('/')
    }catch(e){
      console.error('Registro error', e)
      toast.error(e.message || 'Error al crear cuenta')
    }finally{ setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Registrarse</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <input {...register('firstName')} placeholder="Nombre" className="p-2 border rounded" required />
        <input {...register('lastName')} placeholder="Apellido" className="p-2 border rounded" required />
        <input {...register('email')} type="email" placeholder="Email" className="p-2 border rounded" required />
        <input {...register('password')} type="password" placeholder="Contraseña" className="p-2 border rounded" required />
        <button disabled={loading} className="mt-2 bg-green-600 text-white py-2 rounded">{loading ? 'Creando...' : 'Crear cuenta'}</button>
      </form>
    </div>
  )
}

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { signIn } from '../services/authService'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const { register, handleSubmit } = useForm()
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    try{
      await signIn(data.email, data.password)
      toast.success('Sesión iniciada')
      nav('/')
    }catch(e){
      console.error('Login error', e)
      toast.error(e.message || 'Error al iniciar sesión')
    }finally{ setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Iniciar sesión</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <input {...register('email')} type="email" placeholder="Email" className="p-2 border rounded" required />
        <input {...register('password')} type="password" placeholder="Contraseña" className="p-2 border rounded" required />
        <button disabled={loading} className="mt-2 bg-blue-600 text-white py-2 rounded">{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  )
}

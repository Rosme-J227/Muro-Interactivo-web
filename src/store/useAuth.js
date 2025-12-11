import create from 'zustand'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import * as authSvc from '../services/authService'

const useAuth = create((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  logout: async () => {
    await authSvc.logout()
    set({ user: null })
  }
}))

// listen firebase auth
onAuthStateChanged(auth, (u) => {
  useAuth.getState().setUser(u)
})

export default useAuth

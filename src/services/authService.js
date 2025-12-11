import { auth, db, storage } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut, updateEmail as fbUpdateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword as fbUpdatePassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import useAuth from '../store/useAuth'

export async function signUp(email, password, displayName){
  const res = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(res.user, { displayName })
  // save public profile in Firestore
  try{
    const username = email.split('@')[0]
    await setDoc(doc(db, 'users', res.user.uid), {
      uid: res.user.uid,
      displayName: displayName || null,
      email: res.user.email,
      username,
      photoURL: res.user.photoURL || null,
      createdAt: serverTimestamp()
    })
  }catch(e){
    console.warn('Error saving user doc', e)
  }
  // set in store
  const setUser = useAuth.getState().setUser
  setUser(res.user)
  return res.user
}

export async function signIn(email, password){
  const res = await signInWithEmailAndPassword(auth, email, password)
  useAuth.getState().setUser(res.user)
  return res.user
}

export async function logout(){
  await signOut(auth)
  useAuth.getState().setUser(null)
}

export async function updateUserProfile({ displayName, photoFile }){
  const user = auth.currentUser
  if(!user) throw new Error('Auth required')

  let photoURL = user.photoURL || null
  if(photoFile){
    const path = `users/${user.uid}/profile_${Date.now()}_${photoFile.name}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, photoFile)
    photoURL = await getDownloadURL(storageRef)
  }

  // update Firebase Auth profile
  await updateProfile(user, { displayName, photoURL })

  // update Firestore user doc
  const userRef = doc(db, 'users', user.uid)
  await updateDoc(userRef, {
    displayName: displayName || null,
    photoURL: photoURL || null,
    updatedAt: serverTimestamp()
  })

  // update store
  useAuth.getState().setUser({ ...user, displayName, photoURL })
  return { displayName, photoURL }
}

export async function updateUserEmail(newEmail, currentPassword){
  const user = auth.currentUser
  if(!user) throw new Error('Auth required')
  // reauthenticate
  const cred = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, cred)
  // update email in Auth
  await fbUpdateEmail(user, newEmail)
  // update in Firestore
  const userRef = doc(db, 'users', user.uid)
  await updateDoc(userRef, { email: newEmail, updatedAt: serverTimestamp() })
  // update store
  useAuth.getState().setUser({ ...user, email: newEmail })
  return true
}

export async function updateUserPassword(currentPassword, newPassword){
  const user = auth.currentUser
  if(!user) throw new Error('Auth required')
  const cred = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, cred)
  await fbUpdatePassword(user, newPassword)
  return true
}

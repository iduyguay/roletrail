import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { app } from './firebase.js'

export const auth = getAuth(app)

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback)
}

export function endSession() {
  return signOut(auth)
}

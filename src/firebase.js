import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDQHZKkob_S1zXDjjuWPc_SefM9Fk7rhMg",
  authDomain: "sejours-vacances.firebaseapp.com",
  projectId: "sejours-vacances",
  storageBucket: "sejours-vacances.firebasestorage.app",
  messagingSenderId: "166826082299",
  appId: "1:166826082299:web:ea7921da567d17a3c8155e"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// Google sign-in
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (e) {
    console.error('Sign in error:', e)
    return null
  }
}

export function signOutUser() {
  return signOut(auth)
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

// Cloud operations - use auth UID
export async function saveToCloud(uid, state) {
  if (!uid) return
  try {
    await setDoc(doc(db, 'users', uid), { ...state, updatedAt: Date.now() })
  } catch (e) {
    console.warn('Cloud save failed:', e.message)
  }
}

export async function loadFromCloud(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) return snap.data()
  } catch (e) {
    console.warn('Cloud load failed:', e.message)
  }
  return null
}

export function subscribeToCloud(uid, callback) {
  if (!uid) return () => {}
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) callback(snap.data())
  }, (e) => console.warn('Cloud sync error:', e.message))
}

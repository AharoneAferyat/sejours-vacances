import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'

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

// ID unique par utilisateur — stocké en localStorage
function getUserId() {
  let uid = localStorage.getItem('sejours_uid')
  if (!uid) {
    uid = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    localStorage.setItem('sejours_uid', uid)
  }
  return uid
}

export const USER_ID = getUserId()

// Sauvegarde l'état complet dans Firestore
export async function saveToCloud(state) {
  try {
    await setDoc(doc(db, 'users', USER_ID), {
      ...state,
      updatedAt: Date.now()
    })
  } catch (e) {
    console.warn('Cloud save failed:', e.message)
  }
}

// Charge l'état depuis Firestore
export async function loadFromCloud() {
  try {
    const snap = await getDoc(doc(db, 'users', USER_ID))
    if (snap.exists()) return snap.data()
  } catch (e) {
    console.warn('Cloud load failed:', e.message)
  }
  return null
}

// Écoute les changements en temps réel (sync entre appareils)
export function subscribeToCloud(callback) {
  return onSnapshot(doc(db, 'users', USER_ID), (snap) => {
    if (snap.exists()) callback(snap.data())
  }, (e) => {
    console.warn('Cloud sync error:', e.message)
  })
}

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore'
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

// ─── GOOGLE AUTH ───────────────────────────────────────────────────────────
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

// ─── OWNER DATA ────────────────────────────────────────────────────────────
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

// ─── GUEST ACCESS (code-based) ─────────────────────────────────────────────
// Generate a code from voyageur name + trip name
export function makeGuestCode(voyageurName, tripName) {
  return (voyageurName + tripName)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, '')
}

// Register a guest access when organizer adds a voyageur without email
export async function registerGuestAccess(ownerUid, tripId, tripName, voyageurId, voyageurName) {
  const code = makeGuestCode(voyageurName, tripName)
  const shareId = `${tripId}__${voyageurId}`
  try {
    await setDoc(doc(db, 'guestAccess', shareId), {
      ownerUid,
      tripId,
      voyageurId,
      voyageurName,
      code,
      createdAt: Date.now()
    })
    return code
  } catch (e) {
    console.warn('Register guest failed:', e.message)
    return null
  }
}

// Find a guest access by code
export async function findGuestByCode(name, code) {
  try {
    const normalizedCode = code.toLowerCase().replace(/[^a-z0-9]/g, '')
    const q = query(collection(db, 'guestAccess'), where('code', '==', normalizedCode))
    const snap = await getDocs(q)
    if (snap.empty) return null
    return snap.docs[0].data()
  } catch (e) {
    console.warn('Find guest failed:', e.message)
    return null
  }
}

// Save guest's own valise/sac back to owner's document
export async function saveGuestData(ownerUid, tripId, voyageurId, valise, sac) {
  try {
    const snap = await getDoc(doc(db, 'users', ownerUid))
    if (!snap.exists()) return
    const data = snap.data()
    const trips = data.trips.map(t => {
      if (t.id !== tripId) return t
      return {
        ...t,
        voyageurData: {
          ...t.voyageurData,
          [voyageurId]: { valise, sac }
        }
      }
    })
    await setDoc(doc(db, 'users', ownerUid), { ...data, trips, updatedAt: Date.now() })
  } catch (e) {
    console.warn('Save guest data failed:', e.message)
  }
}

// Subscribe to owner's trip for real-time updates (guest)
export function subscribeToOwnerTrip(ownerUid, callback) {
  return onSnapshot(doc(db, 'users', ownerUid), (snap) => {
    if (snap.exists()) callback(snap.data())
  }, (e) => console.warn('Guest sync error:', e.message))
}

// ─── INVITE CODES ──────────────────────────────────────────────────────────

function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'INV-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function createInviteCode(adminUid, note = '') {
  const code = genInviteCode()
  try {
    await setDoc(doc(db, 'inviteCodes', code), {
      code,
      createdBy: adminUid,
      createdAt: Date.now(),
      note,
      usedBy: null,
      usedAt: null,
      usedEmail: null,
    })
    return code
  } catch (e) {
    console.warn('Create invite failed:', e.message)
    return null
  }
}

export async function validateInviteCode(code) {
  const normalized = code.toUpperCase().trim()
  try {
    const snap = await getDoc(doc(db, 'inviteCodes', normalized))
    if (!snap.exists()) return { error: 'Code invalide' }
    const data = snap.data()
    if (data.usedBy) return { error: 'Ce code a déjà été utilisé' }
    return { valid: true, data }
  } catch (e) {
    return { error: 'Erreur de vérification' }
  }
}

export async function consumeInviteCode(code, uid, email) {
  const normalized = code.toUpperCase().trim()
  try {
    const snap = await getDoc(doc(db, 'inviteCodes', normalized))
    if (!snap.exists() || snap.data().usedBy) return false
    await setDoc(doc(db, 'inviteCodes', normalized), {
      ...snap.data(),
      usedBy: uid,
      usedEmail: email,
      usedAt: Date.now(),
    })
    // Marque l'utilisateur comme autorisé
    await setDoc(doc(db, 'allowedUsers', uid), {
      uid,
      email,
      inviteCode: normalized,
      joinedAt: Date.now(),
    })
    return true
  } catch (e) {
    console.warn('Consume invite failed:', e.message)
    return false
  }
}

export async function isUserAllowed(uid, email) {
  const ADMIN_EMAILS = ['aaferyat@gmail.com', 'ahaferyat5@gmail.com', 'aharone.aferyat@ght-gpne.fr']
  if (ADMIN_EMAILS.includes(email)) return true
  try {
    const snap = await getDoc(doc(db, 'allowedUsers', uid))
    return snap.exists()
  } catch { return false }
}

export async function getAllInviteCodes() {
  try {
    const snap = await getDocs(collection(db, 'inviteCodes'))
    return snap.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt)
  } catch { return [] }
}

export async function getAllUsers() {
  try {
    const snap = await getDocs(collection(db, 'allowedUsers'))
    return snap.docs.map(d => d.data()).sort((a, b) => b.joinedAt - a.joinedAt)
  } catch { return [] }
}

export async function deleteInviteCode(code) {
  try {
    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'inviteCodes', code))
    return true
  } catch { return false }
}

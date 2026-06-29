import { useState, useEffect, useCallback, useRef } from 'react'
import {
  saveToCloud, loadFromCloud, subscribeToCloud,
  onAuthChange, signInWithGoogle, signOutUser, isUserAllowed, consumeInviteCode,
  registerGuestAccess, findGuestByCode, saveGuestData, subscribeToOwnerTrip
} from '../firebase'

const DEFAULT_VOYAGEUR_NAME = 'Moi'

function makeVoyageurData() {
  return { valise: [], sac: [] }
}

function formatLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const wd = d.toLocaleDateString('fr-FR', { weekday: 'short' })
  const mo = d.toLocaleDateString('fr-FR', { month: 'short' })
  return `${wd.charAt(0).toUpperCase()+wd.slice(1)} ${d.getDate()} ${mo}`
}

function fixTrips(trips) {
  return trips.map(t => {
    const voyageurs = t.voyageurs || [{ id: 'v0', name: DEFAULT_VOYAGEUR_NAME }]
    const voyageurData = { ...(t.voyageurData || {}) }
    voyageurs.forEach(v => {
      if (!voyageurData[v.id]) voyageurData[v.id] = makeVoyageurData()
    })
    let days = t.days || []
    if (t.startDate && t.endDate) {
      const validDates = new Set()
      const s = new Date(t.startDate + 'T00:00:00')
      const e = new Date(t.endDate + 'T00:00:00')
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0')
        validDates.add(`${y}-${m}-${day}`)
      }
      const kept = days.filter(d => validDates.has(d.date))
      const keptDates = new Set(kept.map(d => d.date))
      const added = [...validDates].filter(d => !keptDates.has(d)).map(date => ({
        id: 'day_' + date.replace(/-/g,''), date, label: formatLabel(date),
        type: date === t.startDate || date === t.endDate ? 'voyage' : 'rando',
        validated: false, activities: []
      }))
      days = [...kept, ...added].sort((a, b) => a.date.localeCompare(b.date))
      days = days.map(d => ({ ...d, label: formatLabel(d.date) }))
    }
    return { ...t, days, voyageurs, activeVoyageurId: t.activeVoyageurId || voyageurs[0]?.id, voyageurData }
  })
}

// Guest session stored in localStorage
function getGuestSession() {
  try {
    const raw = localStorage.getItem('guest_session')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveGuestSession(session) {
  localStorage.setItem('guest_session', JSON.stringify(session))
}

function clearGuestSession() {
  localStorage.removeItem('guest_session')
  localStorage.removeItem('guest_name')
  localStorage.removeItem('guest_pass')
}

export function useStore() {
  const [uid, setUid] = useState(null)
  const [userEmail, setUserEmail] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)
  const [allowedLoading, setAllowedLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [guestSession, setGuestSessionState] = useState(getGuestSession)
  const [state, setState] = useState({ trips: [], activeTripId: null, notes: [] })
  const [dataLoaded, setDataLoaded] = useState(false)
  const saveTimeout = useRef(null)
  const lastSaveTime = useRef(0)
  const initialized = useRef(false)
  const isGuest = !!guestSession && !uid

  // ─── AUTH ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ADMIN_EMAILS = ['aaferyat@gmail.com', 'ahaferyat5@gmail.com', 'aharone.aferyat@ght-gpne.fr']
    const unsub = onAuthChange(async user => {
      setUid(user?.uid || null)
      setUserEmail(user?.email || null)
      if (user) {
        // Vérifie admin via email ET via providerData (Google peut mettre l'email dans providerData)
        const emailFromProvider = user.providerData?.[0]?.email || user.email || ''
        const admin = ADMIN_EMAILS.includes(emailFromProvider) || ADMIN_EMAILS.includes(user.email)
        setIsAdmin(admin)
        if (admin) {
          setIsAllowed(true)
          setAllowedLoading(false)
        } else {
          const allowed = await isUserAllowed(user.uid, emailFromProvider)
          setIsAllowed(allowed)
          setAllowedLoading(false)
        }
      } else {
        setIsAdmin(false)
        setIsAllowed(false)
        setAllowedLoading(false)
      }
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // ─── LOAD DATA ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return

    // GUEST SESSION
    if (!uid && guestSession) {
      setDataLoaded(false)
      initialized.current = false
      loadFromCloud(guestSession.ownerUid).then(ownerData => {
        if (ownerData?.trips) {
          const trip = ownerData.trips.find(t => t.id === guestSession.tripId)
          if (trip) {
            const fixedTrip = fixTrips([trip])[0]
            setState({ trips: [fixedTrip], activeTripId: fixedTrip.id, notes: [] })
          }
        }
        initialized.current = true
        setDataLoaded(true)
      })

      // Real-time sync from owner
      const unsub = subscribeToOwnerTrip(guestSession.ownerUid, (ownerData) => {
        if (Date.now() - lastSaveTime.current < 3000) return
        const trip = ownerData?.trips?.find(t => t.id === guestSession.tripId)
        if (trip) {
          const fixedTrip = fixTrips([trip])[0]
          setState({ trips: [fixedTrip], activeTripId: fixedTrip.id, notes: [] })
        }
      })
      return () => unsub()
    }

    // GOOGLE AUTH
    if (uid) {
      setDataLoaded(false)
      initialized.current = false
      loadFromCloud(uid).then(async cloudData => {
        let ownData = { trips: [], activeTripId: null, notes: [] }
        if (cloudData?.trips) {
          ownData = { ...cloudData, trips: fixTrips(cloudData.trips) }
          saveToCloud(uid, ownData)
        }

        // Also load trips where this user's email is listed as a voyageur
        // (email-based guest access from other organizers)
        // This is done by querying guestAccess where email matches
        // For now, we rely on the organizer having added their email to the voyageur
        // The shared trip data is stored under the owner's UID

        setState(ownData)
        if (!ownData.activeTripId && ownData.trips.length > 0) {
          setState(s => ({ ...s, activeTripId: ownData.trips[0].id }))
        }
        initialized.current = true
        setDataLoaded(true)
      })

      const unsub = subscribeToCloud(uid, (cloudData) => {
        if (!cloudData?.trips) return
        if (Date.now() - lastSaveTime.current < 3000) return
        setState({ ...cloudData, trips: fixTrips(cloudData.trips) })
      })
      return () => unsub()
    }
  }, [uid, authLoading, guestSession])

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialized.current) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      lastSaveTime.current = Date.now()
      if (uid) {
        // Owner: save everything
        saveToCloud(uid, state)
      } else if (isGuest && guestSession) {
        // Guest: save only own valise/sac
        const trip = state.trips.find(t => t.id === guestSession.tripId)
        if (trip) {
          const vd = trip.voyageurData?.[guestSession.voyageurId]
          if (vd) {
            saveGuestData(guestSession.ownerUid, guestSession.tripId, guestSession.voyageurId, vd.valise || [], vd.sac || [])
          }
        }
      }
    }, 1000)
  }, [state, uid, isGuest, guestSession])

  const update = useCallback((updater) => {
    setState(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater })
  }, [])

  // ─── GUEST LOGIN ──────────────────────────────────────────────────────────
  const loginWithCode = useCallback(async (name, code) => {
    const guest = await findGuestByCode(name, code)
    if (!guest) return { error: 'Code incorrect ou voyageur introuvable' }
    const session = {
      ownerUid: guest.ownerUid,
      tripId: guest.tripId,
      voyageurId: guest.voyageurId,
      voyageurName: guest.voyageurName,
    }
    saveGuestSession(session)
    setGuestSessionState(session)
    return { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    if (uid) await signOutUser()
    clearGuestSession()
    setGuestSessionState(null)
    setUid(null)
    setState({ trips: [], activeTripId: null, notes: [] })
    setDataLoaded(false)
  }, [uid])

  // ─── TRIPS ─────────────────────────────────────────────────────────────────
  const addTrip = useCallback((trip) => {
    const vid = 'v_' + Date.now()
    const fullTrip = {
      ...trip,
      voyageurs: [{ id: vid, name: 'Moi' }],
      activeVoyageurId: vid,
      voyageurData: { [vid]: makeVoyageurData() },
    }
    update(s => ({ ...s, trips: [...s.trips, fullTrip], activeTripId: fullTrip.id }))
  }, [update])

  const updateTrip = useCallback((tripId, changes) => {
    update(s => ({ ...s, trips: s.trips.map(t => t.id === tripId ? { ...t, ...changes } : t) }))
  }, [update])

  const deleteTrip = useCallback((tripId) => {
    update(s => {
      const remaining = s.trips.filter(t => t.id !== tripId)
      return { ...s, trips: remaining, activeTripId: remaining[0]?.id || null }
    })
  }, [update])

  const setActiveTrip = useCallback((tripId) => {
    update(s => ({ ...s, activeTripId: tripId }))
  }, [update])

  // ─── DAYS ──────────────────────────────────────────────────────────────────
  const addDay = useCallback((tripId, day) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId
        ? { ...t, days: [...t.days, day].sort((a,b) => a.date.localeCompare(b.date)) }
        : t)
    }))
  }, [update])

  const updateDay = useCallback((tripId, dayId, changes) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId
        ? { ...t, days: t.days.map(d => d.id === dayId ? { ...d, ...changes } : d) }
        : t)
    }))
  }, [update])

  const deleteDay = useCallback((tripId, dayId) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId
        ? { ...t, days: t.days.filter(d => d.id !== dayId) }
        : t)
    }))
  }, [update])

  const validateDay = useCallback((tripId, dayId) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId
        ? { ...t, days: t.days.map(d => d.id === dayId ? { ...d, validated: !d.validated } : d) }
        : t)
    }))
  }, [update])

  // ─── ACTIVITIES ────────────────────────────────────────────────────────────
  const addActivity = useCallback((tripId, dayId, activity) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId
        ? { ...t, days: t.days.map(d => d.id === dayId ? { ...d, activities: [...d.activities, activity] } : d) }
        : t)
    }))
  }, [update])

  const updateActivity = useCallback((tripId, dayId, actId, changes) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId
        ? { ...t, days: t.days.map(d => d.id === dayId
            ? { ...d, activities: d.activities.map(a => a.id === actId ? { ...a, ...changes } : a) }
            : d) }
        : t)
    }))
  }, [update])

  const deleteActivity = useCallback((tripId, dayId, actId) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId
        ? { ...t, days: t.days.map(d => d.id === dayId
            ? { ...d, activities: d.activities.filter(a => a.id !== actId) }
            : d) }
        : t)
    }))
  }, [update])

  const moveActivity = useCallback((tripId, fromDayId, actId, toDate) => {
    update(s => {
      const trip = s.trips.find(t => t.id === tripId)
      if (!trip) return s
      const fromDay = trip.days.find(d => d.id === fromDayId)
      const activity = fromDay?.activities.find(a => a.id === actId)
      if (!activity) return s
      let newDays = trip.days.map(d => ({
        ...d, activities: d.id === fromDayId ? d.activities.filter(a => a.id !== actId) : d.activities
      }))
      const toDay = newDays.find(d => d.date === toDate)
      if (toDay) {
        newDays = newDays.map(d => d.date === toDate ? { ...d, activities: [...d.activities, activity] } : d)
      } else {
        newDays = [...newDays, {
          id: 'day_' + Date.now(), date: toDate, label: formatLabel(toDate),
          type: activity.type, validated: false, activities: [activity]
        }].sort((a,b) => a.date.localeCompare(b.date))
      }
      return { ...s, trips: s.trips.map(t => t.id === tripId ? { ...t, days: newDays } : t) }
    })
  }, [update])

  const validateActivity = useCallback((tripId, dayId, actId) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId
        ? { ...t, days: t.days.map(d => d.id === dayId
            ? { ...d, activities: d.activities.map(a => a.id === actId ? { ...a, done: !a.done } : a) }
            : d) }
        : t)
    }))
  }, [update])

  // ─── VOYAGEURS ─────────────────────────────────────────────────────────────
  const addVoyageur = useCallback((tripId, name, email = null) => {
    const vid = 'v_' + Date.now()
    update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        // Register guest access if no email (code-based)
        if (!email && uid) {
          registerGuestAccess(uid, tripId, t.name, vid, name)
        }
        return {
          ...t,
          voyageurs: [...(t.voyageurs||[]), { id: vid, name, email }],
          voyageurData: { ...(t.voyageurData||{}), [vid]: makeVoyageurData() },
        }
      })
    }))
  }, [update, uid])

  const updateVoyageurEmail = useCallback((tripId, vid, email) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id !== tripId ? t : {
        ...t,
        voyageurs: (t.voyageurs||[]).map(v => v.id === vid ? { ...v, email } : v)
      })
    }))
  }, [update])

  const removeVoyageur = useCallback((tripId, vid) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const remaining = (t.voyageurs||[]).filter(v => v.id !== vid)
        const vd = { ...(t.voyageurData||{}) }
        delete vd[vid]
        return { ...t, voyageurs: remaining, activeVoyageurId: t.activeVoyageurId === vid ? remaining[0]?.id : t.activeVoyageurId, voyageurData: vd }
      })
    }))
  }, [update])

  const setActiveVoyageur = useCallback((tripId, vid) => {
    update(s => ({ ...s, trips: s.trips.map(t => t.id === tripId ? { ...t, activeVoyageurId: vid } : t) }))
  }, [update])

  // ─── VALISE / SAC ──────────────────────────────────────────────────────────
  const toggleValiseItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid], valise: (vd[vid]?.valise||[]).map(i => i.id===itemId ? {...i,done:!i.done} : i) }}}
    })}))
  }, [update])

  const addValiseItem = useCallback((tripId, vid, text) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid], valise: [...(vd[vid]?.valise||[]), { id:'vi_'+Date.now(), text, done:false }] }}}
    })}))
  }, [update])

  const removeValiseItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid], valise: (vd[vid]?.valise||[]).filter(i => i.id!==itemId) }}}
    })}))
  }, [update])

  const toggleSacItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid], sac: (vd[vid]?.sac||[]).map(i => i.id===itemId ? {...i,done:!i.done} : i) }}}
    })}))
  }, [update])

  const addSacItem = useCallback((tripId, vid, text) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid], sac: [...(vd[vid]?.sac||[]), { id:'si_'+Date.now(), text, done:false }] }}}
    })}))
  }, [update])

  const updateValiseItemQty = useCallback((tripId, vid, itemId, qty) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        valise: (vd[vid]?.valise||[]).map(i => i.id===itemId ? {...i, qty} : i)
      }}}
    })}))
  }, [update])

  const updateSacItemQty = useCallback((tripId, vid, itemId, qty) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        sac: (vd[vid]?.sac||[]).map(i => i.id===itemId ? {...i, qty} : i)
      }}}
    })}))
  }, [update])

  const removeSacItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid], sac: (vd[vid]?.sac||[]).filter(i => i.id!==itemId) }}}
    })}))
  }, [update])

  // ─── NOTES ─────────────────────────────────────────────────────────────────
  const addNote = useCallback((text) => {
    update(s => ({ ...s, notes: [...(s.notes||[]), { id:'n_'+Date.now(), text, done:false }] }))
  }, [update])
  const toggleNote = useCallback((id) => {
    update(s => ({ ...s, notes: (s.notes||[]).map(n => n.id===id ? {...n,done:!n.done} : n) }))
  }, [update])
  const removeNote = useCallback((id) => {
    update(s => ({ ...s, notes: (s.notes||[]).filter(n => n.id!==id) }))
  }, [update])

  // ─── COMPUTED ──────────────────────────────────────────────────────────────
  const activeTrip = state.trips.find(t => t.id === state.activeTripId) || null
  const tripVoyageurs = activeTrip?.voyageurs || []

  // Guest sees only their own voyageur
  const activeVoyageurId = isGuest
    ? guestSession.voyageurId
    : (activeTrip?.activeVoyageurId || tripVoyageurs[0]?.id)

  const voyageurData = activeTrip?.voyageurData || {}
  const currentValise = voyageurData[activeVoyageurId]?.valise || []
  const currentSac = voyageurData[activeVoyageurId]?.sac || []

  return {
    ...state,
    uid, userEmail, authLoading, dataLoaded,
    isGuest, guestSession,
    signIn: signInWithGoogle,
    signOut,
    loginWithCode,
    activeTrip, tripVoyageurs, activeVoyageurId,
    currentValise, currentSac,
    addTrip, updateTrip, deleteTrip, setActiveTrip,
    addDay, updateDay, deleteDay, validateDay,
    addActivity, updateActivity, deleteActivity, moveActivity, validateActivity,
    addVoyageur, removeVoyageur, updateVoyageurEmail, setActiveVoyageur,
    updateValiseItemQty, updateSacItemQty,
    toggleValiseItem, addValiseItem, removeValiseItem,
    toggleSacItem, addSacItem, removeSacItem,
    addNote, toggleNote, removeNote,
  }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { saveToCloud, loadFromCloud, subscribeToCloud, onAuthChange, signInWithGoogle, signOutUser, shareTrip, getSharedTrips, loadSharedTripData } from '../firebase'

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

    // Sync days to startDate-endDate range
    let days = t.days || []
    if (t.startDate && t.endDate) {
      const validDates = new Set()
      const s = new Date(t.startDate + 'T00:00:00')
      const e = new Date(t.endDate + 'T00:00:00')
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear()
        const m = String(d.getMonth()+1).padStart(2,'0')
        const day = String(d.getDate()).padStart(2,'0')
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

    return {
      ...t, days, voyageurs,
      activeVoyageurId: t.activeVoyageurId || voyageurs[0]?.id,
      voyageurData,
    }
  })
}

export function useStore() {
  const [uid, setUid] = useState(null)
  const [userEmail, setUserEmail] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [state, setState] = useState({ trips: [], activeTripId: null, notes: [] })
  const [dataLoaded, setDataLoaded] = useState(false)
  const saveTimeout = useRef(null)
  const lastSaveTime = useRef(0)
  const initialized = useRef(false)

  // Watch auth state
  useEffect(() => {
    const unsub = onAuthChange(user => {
      setUid(user?.uid || null)
      setUserEmail(user?.email || null)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // Load data when uid changes
  useEffect(() => {
    if (!uid) {
      setState({ trips: [], activeTripId: null, notes: [] })
      setDataLoaded(false)
      initialized.current = false
      return
    }

    setDataLoaded(false)
    initialized.current = false

    loadFromCloud(uid).then(async cloudData => {
      let ownData = { trips: [], activeTripId: null, notes: [] }
      if (cloudData && cloudData.trips) {
        ownData = { ...cloudData, trips: fixTrips(cloudData.trips) }
        saveToCloud(uid, ownData)
      }

      // Load shared trips
      if (userEmail) {
        try {
          const shared = await getSharedTrips(userEmail)
          for (const share of shared) {
            const ownerData = await loadSharedTripData(share.ownerUid)
            if (ownerData?.trips) {
              const sharedTrip = ownerData.trips.find(t => t.id === share.tripId)
              if (sharedTrip && !ownData.trips.find(t => t.id === sharedTrip.id)) {
                // Mark as shared so we know not to save it to own storage
                ownData = {
                  ...ownData,
                  trips: [...ownData.trips, { ...sharedTrip, _sharedFrom: share.ownerUid, _isShared: true }]
                }
              }
            }
          }
        } catch(e) { console.warn('Shared trips load error:', e) }
      }

      setState(ownData)
      if (!ownData.activeTripId && ownData.trips.length > 0) {
        setState(s => ({ ...s, activeTripId: ownData.trips[0].id }))
      }
      initialized.current = true
      setDataLoaded(true)
    })

    // Real-time sync
    const unsub = subscribeToCloud(uid, (cloudData) => {
      if (!cloudData?.trips) return
      if (Date.now() - lastSaveTime.current < 3000) return
      setState({ ...cloudData, trips: fixTrips(cloudData.trips) })
    })

    return () => unsub()
  }, [uid])

  // Save on state change
  useEffect(() => {
    if (!initialized.current || !uid) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      lastSaveTime.current = Date.now()
      saveToCloud(uid, state)
    }, 1000)
  }, [state, uid])

  const update = useCallback((updater) => {
    setState(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater })
  }, [])

  // ─── TRIPS ─────────────────────────────────────────────────────────────────
  const addTrip = useCallback((trip) => {
    const vid = 'v_' + Date.now()
    const vname = uid ? 'Moi' : DEFAULT_VOYAGEUR_NAME
    const fullTrip = {
      ...trip,
      voyageurs: [{ id: vid, name: vname }],
      activeVoyageurId: vid,
      voyageurData: { [vid]: makeVoyageurData() },
    }
    update(s => ({ ...s, trips: [...s.trips, fullTrip], activeTripId: fullTrip.id }))
  }, [update, uid])

  const updateTrip = useCallback((tripId, changes) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId ? { ...t, ...changes } : t)
    }))
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
        ? { ...t, days: t.days.map(d => d.id === dayId
            ? { ...d, activities: [...d.activities, activity] } : d) }
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
      trips: s.trips.map(t => t.id === tripId ? {
        ...t,
        voyageurs: [...(t.voyageurs||[]), { id: vid, name, email }],
        voyageurData: { ...(t.voyageurData||{}), [vid]: makeVoyageurData() },
      } : t)
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
        return { ...t, voyageurs: remaining,
          activeVoyageurId: t.activeVoyageurId === vid ? remaining[0]?.id : t.activeVoyageurId,
          voyageurData: vd }
      })
    }))
  }, [update])

  const setActiveVoyageur = useCallback((tripId, vid) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId ? { ...t, activeVoyageurId: vid } : t)
    }))
  }, [update])

  // ─── VALISE / SAC ──────────────────────────────────────────────────────────
  const toggleValiseItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        valise: (vd[vid]?.valise||[]).map(i => i.id===itemId ? {...i,done:!i.done} : i)
      }}}
    })}))
  }, [update])

  const addValiseItem = useCallback((tripId, vid, text) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        valise: [...(vd[vid]?.valise||[]), { id:'vi_'+Date.now(), text, done:false }]
      }}}
    })}))
  }, [update])

  const removeValiseItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        valise: (vd[vid]?.valise||[]).filter(i => i.id!==itemId)
      }}}
    })}))
  }, [update])

  const toggleSacItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        sac: (vd[vid]?.sac||[]).map(i => i.id===itemId ? {...i,done:!i.done} : i)
      }}}
    })}))
  }, [update])

  const addSacItem = useCallback((tripId, vid, text) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        sac: [...(vd[vid]?.sac||[]), { id:'si_'+Date.now(), text, done:false }]
      }}}
    })}))
  }, [update])

  const removeSacItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData||{}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        sac: (vd[vid]?.sac||[]).filter(i => i.id!==itemId)
      }}}
    })}))
  }, [update])

  // ─── INVITATIONS ───────────────────────────────────────────────────────────
  const inviteGuest = useCallback(async (tripId, guestEmail) => {
    if (!uid) return
    // Add to trip guests list
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId ? {
        ...t,
        guests: [...(t.guests || []), { email: guestEmail, accepted: false, invitedAt: Date.now() }]
      } : t)
    }))
    // Create shared trip record in Firebase
    await shareTrip(uid, tripId, guestEmail)
  }, [update, uid])

  const removeGuest = useCallback((tripId, guestEmail) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId ? {
        ...t,
        guests: (t.guests || []).filter(g => g.email !== guestEmail)
      } : t)
    }))
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
  const activeVoyageurId = activeTrip?.activeVoyageurId || tripVoyageurs[0]?.id
  const voyageurData = activeTrip?.voyageurData || {}
  const currentValise = voyageurData[activeVoyageurId]?.valise || []
  const currentSac = voyageurData[activeVoyageurId]?.sac || []

  return {
    ...state,
    uid, authLoading, dataLoaded,
    signIn: signInWithGoogle,
    signOut: signOutUser,
    activeTrip, tripVoyageurs, activeVoyageurId,
    currentValise, currentSac,
    addTrip, updateTrip, deleteTrip, setActiveTrip,
    addDay, updateDay, deleteDay, validateDay,
    addActivity, updateActivity, deleteActivity, moveActivity, validateActivity,
    addVoyageur, removeVoyageur, setActiveVoyageur,
    toggleValiseItem, addValiseItem, removeValiseItem,
    toggleSacItem, addSacItem, removeSacItem,
    addNote, toggleNote, removeNote,
    inviteGuest, removeGuest, userEmail,
  }
}

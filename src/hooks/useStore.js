import { useState, useEffect, useCallback, useRef } from 'react'
import { VAL_DISERE_TRIP, VALISE0, SAC0 } from '../data/defaults'
import { saveToCloud, loadFromCloud, subscribeToCloud } from '../firebase'

const STORAGE_KEY = 'sejours_app_v3'
const DEFAULT_VOYAGEUR = { id: 'v_aharone', name: 'Aharone' }

function makeVoyageurData(vid) {
  return {
    valise: VALISE0.map(x => ({ ...x, id: x.id + '_' + vid })),
    sac: SAC0.map(x => ({ ...x, id: x.id + '_' + vid })),
  }
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' })
  const day = d.getDate()
  const month = d.toLocaleDateString('fr-FR', { month: 'short' })
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month}`
}

function getDaysBetween(start, end) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const days = []
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function ensureVoyageurData(trips) {
  return trips.map(t => {
    // Fix voyageur data
    const voyageurs = t.voyageurs || [DEFAULT_VOYAGEUR]
    const voyageurData = { ...(t.voyageurData || {}) }
    voyageurs.forEach(v => {
      if (!voyageurData[v.id]) voyageurData[v.id] = makeVoyageurData(v.id)
    })

    // Fix days: remove days outside startDate-endDate range, add missing ones
    let days = t.days || []
    if (t.startDate && t.endDate) {
      const validDates = new Set(getDaysBetween(t.startDate, t.endDate))
      // Remove days outside range
      const kept = days.filter(d => validDates.has(d.date))
      const keptDates = new Set(kept.map(d => d.date))
      // Add missing days
      const added = [...validDates].filter(d => !keptDates.has(d)).map(date => ({
        id: 'day_' + date.replace(/-/g,''), date,
        label: formatDateLabel(date),
        type: date === t.startDate || date === t.endDate ? 'voyage' : 'rando',
        validated: false, activities: []
      }))
      days = [...kept, ...added].sort((a, b) => a.date.localeCompare(b.date))
      // Fix labels while we're at it
      days = days.map(d => ({ ...d, label: formatDateLabel(d.date) }))
    }

    return {
      ...t, days, voyageurs,
      activeVoyageurId: t.activeVoyageurId || voyageurs[0]?.id,
      voyageurData,
    }
  })
}

function getDefaultState() {
  const vid = DEFAULT_VOYAGEUR.id
  return {
    trips: [{
      ...VAL_DISERE_TRIP,
      voyageurs: [DEFAULT_VOYAGEUR],
      activeVoyageurId: vid,
      voyageurData: { [vid]: makeVoyageurData(vid) },
    }],
    activeTripId: VAL_DISERE_TRIP.id,
    notes: [],
  }
}

function getLocalState() {
  // Clean old keys
  try { localStorage.removeItem('sejours_app_v1') } catch(e) {}
  try { localStorage.removeItem('sejours_app_v2') } catch(e) {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p.trips && p.trips.length > 0) {
        return { ...p, trips: ensureVoyageurData(p.trips) }
      }
    }
  } catch (e) {}
  return getDefaultState()
}

export function useStore() {
  const [state, setState] = useState(getLocalState)
  const [syncing, setSyncing] = useState(false)
  const saveTimeout = useRef(null)
  const lastSaveTime = useRef(0)
  const initialized = useRef(false)

  // Load from cloud on mount
  useEffect(() => {
    setSyncing(true)
    loadFromCloud().then(cloudData => {
      if (cloudData && cloudData.trips && cloudData.trips.length > 0) {
        // Force-fix days for all trips based on their startDate/endDate
        const migrated = { ...cloudData, trips: ensureVoyageurData(cloudData.trips) }
        setState(migrated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        // Save fixed data back to Firebase so it's clean for next load
        saveToCloud(migrated)
        console.log('Loaded from cloud, days fixed:', migrated.trips[0]?.days?.map(d => d.date))
      } else {
        // No cloud data - save defaults to cloud
        const defaults = getDefaultState()
        saveToCloud(defaults)
        console.log('No cloud data, saved defaults')
      }
      initialized.current = true
      setSyncing(false)
    })

    // Subscribe to real-time updates (sync between devices)
    // Only apply if the update is from ANOTHER device (not our own save)
    const unsub = subscribeToCloud((cloudData) => {
      if (!cloudData || !cloudData.trips) return
      // Ignore updates that come within 3s of our own save (our own echo)
      if (Date.now() - lastSaveTime.current < 3000) return
      const migrated = { ...cloudData, trips: ensureVoyageurData(cloudData.trips) }
      setState(migrated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    })

    return () => unsub()
  }, [])

  // Save to localStorage immediately, cloud after debounce
  useEffect(() => {
    if (!initialized.current) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      lastSaveTime.current = Date.now()
      saveToCloud(state)
    }, 1000)
  }, [state])

  const update = useCallback((updater) => {
    setState(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater })
  }, [])

  // ─── TRIPS ─────────────────────────────────────────────────────────────────
  const addTrip = useCallback((trip) => {
    const vid = DEFAULT_VOYAGEUR.id
    const fullTrip = {
      ...trip,
      voyageurs: [DEFAULT_VOYAGEUR],
      activeVoyageurId: vid,
      voyageurData: { [vid]: makeVoyageurData(vid) },
    }
    update(s => ({ ...s, trips: [...s.trips, fullTrip], activeTripId: fullTrip.id }))
  }, [update])

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
        ? { ...t, days: [...t.days, day].sort((a, b) => a.date.localeCompare(b.date)) }
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
        ...d,
        activities: d.id === fromDayId ? d.activities.filter(a => a.id !== actId) : d.activities
      }))

      const toDay = newDays.find(d => d.date === toDate)
      if (toDay) {
        newDays = newDays.map(d => d.date === toDate
          ? { ...d, activities: [...d.activities, activity] } : d)
      } else {
        // Create new day for this date
        const d = new Date(toDate + 'T00:00:00')
        const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' })
        const label = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'short' })}`
        newDays = [...newDays, {
          id: 'day_' + Date.now(), date: toDate, label,
          type: activity.type, validated: false, activities: [activity]
        }].sort((a, b) => a.date.localeCompare(b.date))
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

  // ─── VOYAGEURS (per trip) ──────────────────────────────────────────────────
  const addVoyageur = useCallback((tripId, name) => {
    const vid = 'v_' + Date.now()
    update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId ? {
        ...t,
        voyageurs: [...(t.voyageurs || []), { id: vid, name }],
        voyageurData: { ...(t.voyageurData || {}), [vid]: makeVoyageurData(vid) },
      } : t)
    }))
  }, [update])

  const removeVoyageur = useCallback((tripId, vid) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const remaining = (t.voyageurs || []).filter(v => v.id !== vid)
        const vd = { ...(t.voyageurData || {}) }
        delete vd[vid]
        return {
          ...t, voyageurs: remaining,
          activeVoyageurId: t.activeVoyageurId === vid ? remaining[0]?.id : t.activeVoyageurId,
          voyageurData: vd,
        }
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
      const vd = t.voyageurData || {}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        valise: (vd[vid]?.valise || []).map(i => i.id === itemId ? { ...i, done: !i.done } : i)
      }}}
    })}))
  }, [update])

  const addValiseItem = useCallback((tripId, vid, text) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData || {}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        valise: [...(vd[vid]?.valise || []), { id: 'vi_' + Date.now(), text, done: false }]
      }}}
    })}))
  }, [update])

  const removeValiseItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData || {}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        valise: (vd[vid]?.valise || []).filter(i => i.id !== itemId)
      }}}
    })}))
  }, [update])

  const toggleSacItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData || {}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        sac: (vd[vid]?.sac || []).map(i => i.id === itemId ? { ...i, done: !i.done } : i)
      }}}
    })}))
  }, [update])

  const addSacItem = useCallback((tripId, vid, text) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData || {}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        sac: [...(vd[vid]?.sac || []), { id: 'si_' + Date.now(), text, done: false }]
      }}}
    })}))
  }, [update])

  const removeSacItem = useCallback((tripId, vid, itemId) => {
    update(s => ({ ...s, trips: s.trips.map(t => {
      if (t.id !== tripId) return t
      const vd = t.voyageurData || {}
      return { ...t, voyageurData: { ...vd, [vid]: { ...vd[vid],
        sac: (vd[vid]?.sac || []).filter(i => i.id !== itemId)
      }}}
    })}))
  }, [update])

  // ─── NOTES ─────────────────────────────────────────────────────────────────
  const addNote = useCallback((text) => {
    update(s => ({ ...s, notes: [...(s.notes||[]), { id: 'n_' + Date.now(), text, done: false }] }))
  }, [update])
  const toggleNote = useCallback((id) => {
    update(s => ({ ...s, notes: (s.notes||[]).map(n => n.id === id ? { ...n, done: !n.done } : n) }))
  }, [update])
  const removeNote = useCallback((id) => {
    update(s => ({ ...s, notes: (s.notes||[]).filter(n => n.id !== id) }))
  }, [update])

  // ─── COMPUTED ──────────────────────────────────────────────────────────────
  const activeTrip = state.trips.find(t => t.id === state.activeTripId) || null
  const tripVoyageurs = activeTrip?.voyageurs || [DEFAULT_VOYAGEUR]
  const activeVoyageurId = activeTrip?.activeVoyageurId || tripVoyageurs[0]?.id
  const voyageurData = activeTrip?.voyageurData || {}
  const currentValise = voyageurData[activeVoyageurId]?.valise || []
  const currentSac = voyageurData[activeVoyageurId]?.sac || []

  return {
    ...state,
    syncing,
    activeTrip, tripVoyageurs, activeVoyageurId,
    currentValise, currentSac,
    addTrip, updateTrip, deleteTrip, setActiveTrip,
    addDay, updateDay, deleteDay, validateDay,
    addActivity, updateActivity, deleteActivity, moveActivity, validateActivity,
    addVoyageur, removeVoyageur, setActiveVoyageur,
    toggleValiseItem, addValiseItem, removeValiseItem,
    toggleSacItem, addSacItem, removeSacItem,
    addNote, toggleNote, removeNote,
  }
}

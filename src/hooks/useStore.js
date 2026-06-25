import { useState, useEffect, useCallback } from 'react'
import { VAL_DISERE_TRIP, VALISE0, SAC0 } from '../data/defaults'

const STORAGE_KEY = 'sejours_app_v3'

const DEFAULT_VOYAGEUR = { id: 'v_aharone', name: 'Aharone' }

function makeVoyageurData(vid) {
  return {
    valise: VALISE0.map(x => ({ ...x, id: x.id + '_' + vid })),
    sac: SAC0.map(x => ({ ...x, id: x.id + '_' + vid })),
  }
}

function ensureVoyageurData(trips) {
  return trips.map(t => {
    const voyageurs = t.voyageurs || [DEFAULT_VOYAGEUR]
    const voyageurData = t.voyageurData || {}
    // Ensure every voyageur has data
    voyageurs.forEach(v => {
      if (!voyageurData[v.id]) {
        voyageurData[v.id] = makeVoyageurData(v.id)
      }
    })
    return {
      ...t,
      voyageurs,
      activeVoyageurId: t.activeVoyageurId || voyageurs[0]?.id,
      voyageurData,
    }
  })
}

function getInitialState() {
  // Clean up old storage keys to avoid phantom data
  try { localStorage.removeItem('sejours_app_v1') } catch(e) {}
  try { localStorage.removeItem('sejours_app_v2') } catch(e) {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p.trips && p.trips.length > 0) {
        // Migrate: ensure all trips have voyageurData and lat/lon
        return { ...p, trips: ensureVoyageurData(p.trips) }
      }
    }
  } catch (e) {}

  const tripId = VAL_DISERE_TRIP.id
  const vid = DEFAULT_VOYAGEUR.id
  return {
    trips: [{
      ...VAL_DISERE_TRIP,
      voyageurs: [DEFAULT_VOYAGEUR],
      activeVoyageurId: vid,
      voyageurData: { [vid]: makeVoyageurData(vid) },
    }],
    activeTripId: tripId,
    notes: [
      { id: 'n0', text: 'Vérifier météo chaque soir', done: false },
      { id: 'n1', text: 'Télécharger AllTrails hors-ligne', done: false },
    ],
  }
}

export function useStore() {
  const [state, setState] = useState(getInitialState)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch (e) {}
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
        ...d,
        activities: d.id === fromDayId ? d.activities.filter(a => a.id !== actId) : d.activities
      }))

      const toDay = newDays.find(d => d.date === toDate)
      if (toDay) {
        newDays = newDays.map(d => d.date === toDate ? { ...d, activities: [...d.activities, activity] } : d)
      } else {
        newDays = [...newDays, {
          id: 'day_' + Date.now(), date: toDate,
          label: toDate, type: activity.type, validated: false, activities: [activity]
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

  // ─── VOYAGEURS (per trip) ─────────────────────────────────────────────────
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
        const oldVd = t.voyageurData || {}; const voyageurData = Object.fromEntries(Object.entries(oldVd).filter(([k]) => k !== vid))
        return {
          ...t,
          voyageurs: remaining,
          activeVoyageurId: t.activeVoyageurId === vid ? remaining[0]?.id : t.activeVoyageurId,
          voyageurData,
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

  // ─── VALISE / SAC (per trip per voyageur) ──────────────────────────────────
  const toggleValiseItem = useCallback((tripId, vid, itemId) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const vd = t.voyageurData || {}
        return { ...t, voyageurData: { ...vd, [vid]: {
          ...vd[vid],
          valise: (vd[vid]?.valise || []).map(i => i.id === itemId ? { ...i, done: !i.done } : i)
        }}}
      })
    }))
  }, [update])

  const addValiseItem = useCallback((tripId, vid, text) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const vd = t.voyageurData || {}
        return { ...t, voyageurData: { ...vd, [vid]: {
          ...vd[vid],
          valise: [...(vd[vid]?.valise || []), { id: 'vi_' + Date.now(), text, done: false }]
        }}}
      })
    }))
  }, [update])

  const removeValiseItem = useCallback((tripId, vid, itemId) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const vd = t.voyageurData || {}
        return { ...t, voyageurData: { ...vd, [vid]: {
          ...vd[vid],
          valise: (vd[vid]?.valise || []).filter(i => i.id !== itemId)
        }}}
      })
    }))
  }, [update])

  const toggleSacItem = useCallback((tripId, vid, itemId) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const vd = t.voyageurData || {}
        return { ...t, voyageurData: { ...vd, [vid]: {
          ...vd[vid],
          sac: (vd[vid]?.sac || []).map(i => i.id === itemId ? { ...i, done: !i.done } : i)
        }}}
      })
    }))
  }, [update])

  const addSacItem = useCallback((tripId, vid, text) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const vd = t.voyageurData || {}
        return { ...t, voyageurData: { ...vd, [vid]: {
          ...vd[vid],
          sac: [...(vd[vid]?.sac || []), { id: 'si_' + Date.now(), text, done: false }]
        }}}
      })
    }))
  }, [update])

  const removeSacItem = useCallback((tripId, vid, itemId) => {
    update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t
        const vd = t.voyageurData || {}
        return { ...t, voyageurData: { ...vd, [vid]: {
          ...vd[vid],
          sac: (vd[vid]?.sac || []).filter(i => i.id !== itemId)
        }}}
      })
    }))
  }, [update])

  // ─── NOTES ─────────────────────────────────────────────────────────────────
  const addNote = useCallback((text) => {
    update(s => ({ ...s, notes: [...s.notes, { id: 'n_' + Date.now(), text, done: false }] }))
  }, [update])

  const toggleNote = useCallback((id) => {
    update(s => ({ ...s, notes: s.notes.map(n => n.id === id ? { ...n, done: !n.done } : n) }))
  }, [update])

  const removeNote = useCallback((id) => {
    update(s => ({ ...s, notes: s.notes.filter(n => n.id !== id) }))
  }, [update])

  // ─── COMPUTED ──────────────────────────────────────────────────────────────
  const activeTrip = state.trips.find(t => t.id === state.activeTripId) || null
  const tripVoyageurs = activeTrip?.voyageurs || [DEFAULT_VOYAGEUR]
  const activeVoyageurId = activeTrip?.activeVoyageurId || tripVoyageurs[0]?.id
  const activeVoyageur = tripVoyageurs.find(v => v.id === activeVoyageurId) || tripVoyageurs[0]
  const voyageurData = activeTrip?.voyageurData || {}
  const currentValise = voyageurData[activeVoyageurId]?.valise || []
  const currentSac = voyageurData[activeVoyageurId]?.sac || []

  return {
    ...state,
    activeTrip,
    tripVoyageurs,
    activeVoyageurId,
    activeVoyageur,
    currentValise,
    currentSac,
    addTrip, updateTrip, deleteTrip, setActiveTrip,
    addDay, updateDay, deleteDay, validateDay,
    addActivity, updateActivity, deleteActivity, moveActivity, validateActivity,
    addVoyageur, removeVoyageur, setActiveVoyageur,
    toggleValiseItem, addValiseItem, removeValiseItem,
    toggleSacItem, addSacItem, removeSacItem,
    addNote, toggleNote, removeNote,
  }
}

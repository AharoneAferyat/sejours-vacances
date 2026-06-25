export function formatCountdown(ms) {
  if (ms <= 0) return null
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const p = n => String(n).padStart(2, '0')
  return `${d}j ${p(h)}h ${p(m)}m ${p(sec)}s`
}

export function msUntil(dateStr) {
  return new Date(dateStr + 'T00:00:00') - new Date()
}

export function getDaysBetween(start, end) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const days = []
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const day = String(d.getDate()).padStart(2,'0')
    days.push(`${y}-${m}-${day}`)
  }
  return days
}

// "Lun 6 juil" — le format qu'on veut
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' })
  const day = d.getDate()
  const month = d.toLocaleDateString('fr-FR', { month: 'short' })
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month}`
}

export function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'long' })
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day}/${month}/${year}`
}

export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${d.getFullYear()}`
}

export function isoToDisplay(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function displayToISO(display) {
  if (!display) return ''
  const parts = display.replace(/\D/g, '')
  if (parts.length !== 8) return ''
  return `${parts.slice(4)}-${parts.slice(2, 4)}-${parts.slice(0, 2)}`
}

export function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export function calcTripDays(startDate, endDate) {
  const s = new Date(startDate + 'T00:00:00')
  const e = new Date(endDate + 'T00:00:00')
  return Math.round((e - s) / 86400000)
}

export function getTripStatus(trip) {
  const today = getTodayStr()
  if (today < trip.startDate) return 'upcoming'
  if (today > trip.endDate) return 'past'
  return 'active'
}

export function getMsTripStart(trip) {
  return msUntil(trip.startDate)
}

export function calcDayStats(activities) {
  const totalKm = activities.reduce((s, a) => s + (a.distanceKm || 0), 0)
  const totalDplus = activities.reduce((s, a) => s + (a.dplus || 0), 0)
  const totalMin = activities.reduce((s, a) => s + (a.durationMin || 0), 0)
  return { totalKm, totalDplus, totalMin }
}

export function formatDuration(minutes) {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

export function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

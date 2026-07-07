import { useState, useEffect } from 'react'
import QRCode from './QRCode'




function getTripStatus(trip) {
  if (trip.archived) return 'archived'
  if (trip.closed) return 'closed'
  if (!trip.startDate) return 'unknown'
  const today = new Date()
  const todayStr = today.toISOString().slice(0,10)
  if (todayStr < trip.startDate) return 'upcoming'
  if (todayStr > trip.endDate) {
    // Auto-archive after 6 months
    const end = new Date(trip.endDate + 'T23:59:59')
    const sixMonths = 6 * 30 * 86400000
    if (today - end > sixMonths) return 'archived'
    return 'past'
  }
  return 'ongoing'
}

function getCountdown(startDate, endDate) {
  const now = new Date()
  const start = new Date(startDate + 'T00:00:00')
  const end = endDate ? new Date(endDate + 'T23:59:59') : null
  const diff = start - now
  if (diff > 0) {
    const j = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return { j, h, m, status: 'upcoming' }
  }
  if (end && now > end) {
    const since = now - end
    const daysSince = Math.floor(since / 86400000)
    return { daysSince, status: 'past' }
  }
  return { j: 0, h: 0, m: 0, status: 'ongoing' }
}

function getTodayInfo(trip) {
  if (!trip?.days?.length || !trip.startDate) return null
  const today = new Date().toISOString().slice(0,10)
  const todayDay = trip.days.find(d => d.date === today)
  if (!todayDay) return null
  const dayIndex = trip.days.indexOf(todayDay)
  const tomorrow = trip.days[dayIndex + 1] || null
  const acts = todayDay.activities || []
  const doneCount = acts.filter(a => a.done).length
  return { todayDay, dayIndex, tomorrow, acts, doneCount }
}

/* ── Activity Detail Modal (from hype up) ── */
function ActivityModal({ act, dayLabel, onClose, onValidate, onGoTo }) {
  if (!act) return null
  const dur = act.durationMin || 0
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{act.emoji || '🎯'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>{act.title}</div>
            {act.subtitle && <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{act.subtitle}</div>}
          </div>
          {act.done && <span style={{ fontSize: '.72rem', padding: '2px 8px', borderRadius: 8, background: 'var(--green-light)', color: 'var(--green)', fontWeight: 600 }}>✅ Validée</span>}
        </div>

        {dayLabel && <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>📅 {dayLabel}</div>}

        {/* Stats */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.65rem' }}>
          {act.startTime && <span style={{ fontSize: '.78rem', padding: '3px 10px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-muted)' }}>🕐 {act.startTime}{act.endTime ? ` – ${act.endTime}` : ''}</span>}
          {dur > 0 && <span style={{ fontSize: '.78rem', padding: '3px 10px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-muted)' }}>⏱ {dur >= 60 ? Math.floor(dur/60)+'h'+(dur%60||'') : dur+'min'}</span>}
          {act.distanceKm > 0 && <span style={{ fontSize: '.78rem', padding: '3px 10px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-muted)' }}>📍 {act.distanceKm} km</span>}
          {act.dplus > 0 && <span style={{ fontSize: '.78rem', padding: '3px 10px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-muted)' }}>⬆️ {act.dplus}m D+</span>}
          {act.difficulty && <span style={{ fontSize: '.78rem', padding: '3px 10px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-muted)' }}>{act.difficulty}</span>}
          {act.price && <span style={{ fontSize: '.78rem', padding: '3px 10px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-muted)' }}>💰 {act.price}</span>}
        </div>

        {/* Description */}
        {act.desc && <div style={{ fontSize: '.84rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: '.65rem', padding: '.5rem .6rem', background: 'var(--bg)', borderRadius: 10 }}>{act.desc}</div>}

        {/* Tip */}
        {act.tip && <div style={{ fontSize: '.8rem', color: 'var(--amber)', background: 'var(--amber-light)', borderRadius: 10, padding: '.5rem .7rem', marginBottom: '.65rem' }}>💡 {act.tip}</div>}

        {/* Links */}
        {(act.links || []).length > 0 && (
          <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.65rem' }}>
            {act.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: '.78rem', padding: '4px 12px', borderRadius: 8, background: 'var(--blue-light)', color: 'var(--blue)', textDecoration: 'none', fontWeight: 500 }}>
                {l.label} ↗
              </a>
            ))}
          </div>
        )}

        {/* Gear */}
        {(act.gear || []).length > 0 && (
          <div style={{ marginBottom: '.65rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>🎒 Matériel recommandé</div>
            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
              {act.gear.map((g, i) => <span key={i} style={{ fontSize: '.75rem', padding: '2px 8px', borderRadius: 6, background: 'var(--bg)', color: 'var(--text-muted)' }}>{g}</span>)}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem' }}>
          <button onClick={() => { onValidate(); onClose() }} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', borderRadius: 10 }}>
            {act.done ? '↩ Dé-valider' : '✅ Valider'}
          </button>
          <button onClick={() => { onClose(); onGoTo?.() }} className="btn" style={{ flex: 1, justifyContent: 'center', borderRadius: 10 }}>
            📋 Aller à l'activité
          </button>
          <button onClick={onClose} className="btn" style={{ justifyContent: 'center', borderRadius: 10, padding: '8px 14px' }}>✕</button>
        </div>
      </div>
    </div>
  )
}

const PHOTOS = {
  mountain:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop&crop=entropy&h=350',
  default:'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80&fit=crop&crop=entropy&h=350',
}
function getFallbackPhoto(name='',dest='') {
  const t = (name+' '+dest).toLowerCase()
  if (/mont|alp|isère|savoie|chamonix|ski|neige|grenoble|annecy/.test(t)) return PHOTOS.mountain
  return PHOTOS.default
}


const EXPIRE_OPTS = [
  { label: 'Jamais', value: null },
  { label: '1 heure', value: 3600000 },
  { label: '24 heures', value: 86400000 },
  { label: '7 jours', value: 604800000 },
]
const USES_OPTS = [
  { label: 'Illimité', value: null },
  { label: '1', value: 1 },
  { label: '3', value: 3 },
  { label: '5', value: 5 },
  { label: '10', value: 10 },
]

function InviteGenerator({ tripId, tripName, ownerUid }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [maxUses, setMaxUses] = useState(null)
  const [expiresIn, setExpiresIn] = useState(null)

  const generate = async () => {
    setLoading(true)
    try {
      const { generateShareCode } = await import('../firebase')
      const code = await generateShareCode(ownerUid, tripId, tripName, { maxUses, expiresIn })
      setUrl(window.location.origin + '?share=' + code)
    } catch { alert('Erreur') }
    setLoading(false)
  }

  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (url) {
    return (
      <div>
        <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
          <input value={url} readOnly style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '.75rem', fontFamily: 'monospace', background: 'var(--bg)' }} onClick={e => e.target.select()} />
          <button onClick={copy} className="btn btn-primary">{copied ? '✅' : '📋 Copier'}</button>
        </div>
        {/* QR Code */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
          <QRCode value={url} size={160} />
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '.4rem' }}>Scanne ce QR code pour rejoindre le séjour</div>
        <button onClick={() => setUrl(null)} style={{ display: 'block', width: '100%', marginTop: '.3rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.72rem', color: 'var(--text-muted)', fontFamily: 'inherit', textAlign: 'center' }}>🔄 Générer un nouveau lien</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.6rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.2rem', textTransform: 'uppercase' }}>Expiration</label>
          <select value={expiresIn || ''} onChange={e => setExpiresIn(e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.8rem', fontFamily: 'inherit' }}>
            {EXPIRE_OPTS.map(o => <option key={o.label} value={o.value || ''}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.2rem', textTransform: 'uppercase' }}>Max personnes</label>
          <select value={maxUses || ''} onChange={e => setMaxUses(e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.8rem', fontFamily: 'inherit' }}>
            {USES_OPTS.map(o => <option key={o.label} value={o.value || ''}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <button onClick={generate} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
        {loading ? '⏳ Génération...' : '🔗 Générer le lien d\'invitation'}
      </button>
    </div>
  )
}

/* ── Souvenir Photos per day ── */
function SouvenirPhotos({ trip, onUpdateTrip }) {
  const days = trip.days || []
  const fileInputRef = { current: null }

  const addPhoto = (dayId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return alert('Photo trop lourde (max 2 Mo). Compresse-la avant.')
    const reader = new FileReader()
    reader.onload = () => {
      const photo = { id: 'ph_' + Date.now(), data: reader.result, name: file.name, addedAt: Date.now() }
      const newDays = days.map(d => d.id === dayId ? { ...d, photos: [...(d.photos || []), photo] } : d)
      onUpdateTrip(trip.id, { days: newDays })
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = (dayId, photoId) => {
    if (!confirm('Supprimer cette photo ?')) return
    const newDays = days.map(d => d.id === dayId ? { ...d, photos: (d.photos || []).filter(p => p.id !== photoId) } : d)
    onUpdateTrip(trip.id, { days: newDays })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '.5rem' }}>
      {days.map(day => {
        const photos = day.photos || []
        const acts = day.activities || []
        return (
          <div key={day.id} style={{ background: 'var(--bg)', borderRadius: 10, padding: '.6rem .7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.35rem' }}>
              <div style={{ fontSize: '.78rem', fontWeight: 600 }}>
                {day.label}
                {acts.length > 0 && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '.3rem' }}>— {acts.map(a => a.emoji || '').filter(Boolean).join(' ')} {acts[0]?.title}</span>}
              </div>
              <label style={{ fontSize: '.7rem', color: 'var(--green)', fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
                ＋ Photo
                <input type="file" accept="image/*" onChange={e => addPhoto(day.id, e)} style={{ display: 'none' }} />
              </label>
            </div>
            {photos.length > 0 ? (
              <div style={{ display: 'flex', gap: '.35rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                {photos.map(p => (
                  <div key={p.id} style={{ position: 'relative', flexShrink: 0, width: 72, height: 72, borderRadius: 8, overflow: 'hidden' }}>
                    <img src={p.data} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => removePhoto(day.id, p.id)}
                      style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '.7rem', color: 'var(--text-light)', fontStyle: 'italic' }}>Pas encore de photos</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard({ trips, onSelectTrip, onCreateTrip, userName, activeTrip, tomorrowWeather, onUpdateDay, onUpdateTrip, onScrollToDay, setTab, uid }) {
  const [time, setTime] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showSouvenirs, setShowSouvenirs] = useState(null)
  const [selectedAct, setSelectedAct] = useState(null) // { act, dayLabel, dayId } // tripId to show photos

  const upcoming = trips.filter(t => getTripStatus(t)==='upcoming').sort((a,b) => a.startDate?.localeCompare(b.startDate))
  const ongoing = trips.filter(t => getTripStatus(t)==='ongoing')
  const past = trips.filter(t => ['past','closed'].includes(getTripStatus(t)))
  const archived = trips.filter(t => getTripStatus(t)==='archived')
  const nextTrip = ongoing[0] || upcoming[0]
  const trip = activeTrip || nextTrip || trips[0]

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}))
      if (trip?.startDate) setCountdown(getCountdown(trip.startDate, trip.endDate))
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [trip?.startDate])

  // Stats du séjour
  const totalKm = trip?.days?.reduce((s,d) => s + d.activities.reduce((a,act) => a + (parseFloat(act.distanceKm)||0), 0), 0) || 0
  const totalDplus = trip?.days?.reduce((s,d) => s + d.activities.reduce((a,act) => a + (parseFloat(act.dplus)||0), 0), 0) || 0
  const totalDuration = trip?.days?.reduce((s,d) => s + d.activities.reduce((a,act) => a + (parseFloat(act.durationMin)||0), 0), 0) || 0
  const totalDays = trip?.days?.length || 0
  const totalActs = trip?.days?.reduce((s,d) => s + (d.activities?.length||0), 0) || 0
  const voyageurs = trip?.voyageurs || []
  const photo = trip?.headerPhoto || getFallbackPhoto(trip?.name, trip?.destination)

  // Budget
  const expenses = trip?.expenses || []
  const perso = Object.values(trip?.voyageurData || {}).flatMap(vd => vd.depenses || [])
  const totalSpent = [...expenses, ...perso].reduce((s,e) => s + (parseFloat(e.amount)||0), 0)
  const budget = trip?.budget || 0

  // Sac à dos
  const sacItems = Object.values(trip?.voyageurData || {}).flatMap(vd => vd.sac || [])
  const sacDone = sacItems.filter(i => i.done).length

  if (trips.length === 0) {
    return (
      <div style={{ maxWidth: 550, margin: '4rem auto', textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '.75rem' }}>🥾</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '.5rem' }}>
          {userName ? `Bienvenue, ${userName} !` : 'Bienvenue !'}
        </h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Planifie tes randonnées et séjours de A à Z — météo, activités, budget, valise.
        </p>
        <button onClick={onCreateTrip} className="btn btn-primary" style={{ padding: '.9rem 2.5rem', fontSize: '1rem', borderRadius: 14 }}>＋ Créer mon premier séjour</button>
      </div>
    )
  }

  const goTrip = (tab) => { if (trip) { onSelectTrip(trip.id); setTab?.(tab) } }

  return (
    <div style={{ padding: 'clamp(.75rem,2vw,1.5rem)' }}>

      {/* ── HERO CARD — prochain séjour (toujours le plus proche par date) ── */}
      {(nextTrip || trips[0]) && (() => {
        const hero = nextTrip || trips[0]
        const heroPhoto = hero.headerPhoto || getFallbackPhoto(hero.name, hero.destination)
        const heroVoy = hero.voyageurs || []
        return (
          <div style={{
            borderRadius: 18, overflow: 'hidden', marginBottom: '1rem',
            boxShadow: '0 4px 24px rgba(0,0,0,.1)', position: 'relative',
            background: hero.color || 'var(--green)', color: '#fff', minHeight: 200,
          }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: .45 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.55) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(1rem,3vw,1.5rem)' }}>
              <div style={{ fontSize: '.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .75, marginBottom: '.35rem' }}>
                {getTripStatus(hero) === 'ongoing' ? '🟢 Séjour en cours' : getTripStatus(hero) === 'closed' ? '🔒 Séjour clos' : ['past','archived'].includes(getTripStatus(hero)) ? '📸 Séjour terminé' : '📅 Prochain séjour'}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.3rem,4vw,1.8rem)', fontWeight: 700, marginBottom: '.1rem' }}>{hero.name}</div>
              {hero.subtitle && <div style={{ fontSize: '.88rem', opacity: .85, marginBottom: '.3rem' }}>{hero.subtitle}</div>}
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', fontSize: '.78rem', opacity: .85, marginBottom: '.7rem' }}>
                {hero.destination && <span>📍 {hero.destination}</span>}
                {hero.startDate && <span>📅 {new Date(hero.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} → {new Date(hero.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</span>}
                {heroVoy.length > 0 && <span>👥 {heroVoy.length} voyageur{heroVoy.length > 1 ? 's' : ''}</span>}
              </div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                <button onClick={() => { onSelectTrip(hero.id); setTab?.('planning') }} style={{ background: '#fff', color: 'var(--text)', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Ouvrir le séjour →</button>
                <button onClick={() => setShowInvite(true)} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 10, padding: '7px 14px', fontSize: '.78rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>🔗 Inviter</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── GRID : Countdown + Météo | Stats + Voyageurs ── */}
      {trip && (
        <div className="dashboard-grid" style={{ marginBottom: '1rem' }}>
          <div>
            {/* Countdown OR Today's program OR Souvenirs */}
            {countdown?.status === 'upcoming' && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', marginBottom: '.65rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.4rem' }}>⏳ Avant le départ</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginBottom: '.15rem' }}>{countdown.j}j {countdown.h}h {countdown.m}m</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                  {new Date(trip.startDate+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </div>
              </div>
            )}
            {countdown?.status === 'ongoing' && (() => {
              const info = getTodayInfo(trip)
              if (!info) return null
              const { todayDay, dayIndex, acts, doneCount, tomorrow } = info
              return (
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', marginBottom: '.65rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--green)', marginBottom: '.5rem' }}>🟢 Aujourd'hui — Jour {dayIndex + 1}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 700, marginBottom: '.5rem' }}>{todayDay.label}</div>

                  {acts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                      {acts.map((act, i) => (
                        <div key={act.id || i} onClick={() => setSelectedAct({ act, dayLabel: todayDay.label, dayId: todayDay.id })} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', padding: '.5rem .6rem', borderRadius: 10, background: act.done ? 'var(--green-light)' : 'var(--bg)', cursor: 'pointer' }}>
                          <span style={{ fontSize: '.9rem', marginTop: 1, flexShrink: 0 }}>{act.done ? '✅' : (act.emoji || '🎯')}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '.82rem', fontWeight: 500, textDecoration: act.done ? 'line-through' : 'none', color: act.done ? 'var(--text-muted)' : 'var(--text)', lineHeight: 1.35 }}>{act.title}</div>
                            <div style={{ display: 'flex', gap: '.5rem', fontSize: '.65rem', color: 'var(--text-muted)', marginTop: 2, flexWrap: 'wrap' }}>
                              {act.startTime && <span>🕐 {act.startTime}</span>}
                              {act.durationMin > 0 && <span>⏱ {act.durationMin >= 60 ? Math.floor(act.durationMin/60)+'h'+(act.durationMin%60 ? (act.durationMin%60<10?'0':'')+act.durationMin%60 : '') : act.durationMin+'min'}</span>}
                              {act.distanceKm > 0 && <span>📍 {act.distanceKm} km</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: '.7rem', color: 'var(--text-light)', flexShrink: 0, marginTop: 2 }}>›</span>
                        </div>
                      ))}
                      {/* Progress */}
                      <div style={{ marginTop: '.3rem' }}>
                        <div style={{ height: 4, background: 'rgba(0,0,0,.06)', borderRadius: 20, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: (acts.length > 0 ? doneCount / acts.length * 100 : 0) + '%', background: 'var(--green)', borderRadius: 20, transition: 'width .3s' }} />
                        </div>
                        <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', marginTop: 3 }}>{doneCount}/{acts.length} terminée{doneCount > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', padding: '.3rem 0' }}>🏖 Journée libre — pas d'activités prévues</div>
                  )}

                  {/* Tomorrow preview */}
                  {tomorrow && (tomorrow.activities?.length || 0) > 0 && (
                    <div style={{ marginTop: '.65rem', paddingTop: '.55rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', marginBottom: '.3rem' }}>📅 Demain — {tomorrow.label}</div>
                      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                        {tomorrow.activities.slice(0, 3).map((act, i) => (
                          <span key={i} onClick={() => setSelectedAct({ act, dayLabel: tomorrow.label, dayId: tomorrow.id })} style={{ fontSize: '.72rem', padding: '3px 8px', borderRadius: 6, background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            {act.emoji || '🎯'} {act.title}
                          </span>
                        ))}
                        {tomorrow.activities.length > 3 && <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>+{tomorrow.activities.length - 3}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
            {countdown?.status === 'past' && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', marginBottom: '.65rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>📸 Souvenirs</div>
                <div style={{ fontSize: '.92rem', fontWeight: 600, marginBottom: '.4rem' }}>Le séjour est terminé !</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.65rem' }}>
                  {countdown.daysSince === 0 ? 'Terminé aujourd\'hui' : countdown.daysSince === 1 ? 'Terminé hier' : `Il y a ${countdown.daysSince} jours`}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem', marginBottom: '.5rem' }}>
                  {[
                    { icon: '📍', val: `${totalKm.toFixed(1)} km`, lbl: 'parcourus' },
                    { icon: '⛰', val: `${totalDplus} m`, lbl: 'de dénivelé' },
                    { icon: '✅', val: `${totalActs}`, lbl: 'activités faites' },
                    { icon: '📅', val: `${totalDays} jours`, lbl: 'de vacances' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <span style={{ fontSize: '.9rem' }}>{s.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{s.val}</div>
                        <div style={{ fontSize: '.6rem', color: 'var(--text-muted)' }}>{s.lbl}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {budget > 0 && totalSpent > 0 && (
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', padding: '.4rem .5rem', background: 'var(--bg)', borderRadius: 8, marginBottom: '.65rem' }}>
                    💰 {totalSpent.toFixed(0)}€ dépensés sur {budget}€ de budget
                  </div>
                )}

                {/* Photos souvenirs */}
                <button onClick={() => setShowSouvenirs(showSouvenirs === trip.id ? null : trip.id)}
                  style={{ width: '100%', padding: '.5rem', border: '1.5px dashed var(--border)', borderRadius: 10, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
                  📷 {showSouvenirs === trip.id ? 'Masquer' : 'Voir'} les photos souvenirs ({(trip.days || []).reduce((s, d) => s + (d.photos?.length || 0), 0)} photos)
                </button>

                {showSouvenirs === trip.id && (
                  <SouvenirPhotos trip={trip} onUpdateTrip={onUpdateTrip} />
                )}

                {/* Close / Archive actions */}
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem' }}>
                  {!trip.closed && (
                    <button onClick={() => { if (confirm('Clore ce séjour ? Il ne sera plus modifiable.')) onUpdateTrip(trip.id, { closed: true }) }}
                      style={{ flex: 1, padding: '.45rem', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.78rem', color: 'var(--text)', fontWeight: 500 }}>
                      🔒 Clore le séjour
                    </button>
                  )}
                  {trip.closed && !trip.archived && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.78rem', color: 'var(--green)', fontWeight: 500 }}>
                      🔒 Séjour clos
                    </div>
                  )}
                  <button onClick={() => { if (confirm('Archiver ce séjour ? Il sera déplacé dans les archives.')) onUpdateTrip(trip.id, { archived: true }) }}
                    style={{ flex: 1, padding: '.45rem', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    📦 Archiver
                  </button>
                </div>
              </div>
            )}

            {/* Statistiques */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Statistiques</div>
              <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                {[
                  { val: `${totalKm.toFixed(1)} km`, label: 'Trajet total', icon: '📍' },
                  { val: `${Math.floor(totalDuration/60)}h${String(totalDuration%60).padStart(2,'0')}`, label: 'Activités prévues', icon: '⏱' },
                  { val: `${totalDplus} m D+`, label: 'Dénivelé positif', icon: '⛰' },
                  { val: `${totalDays} jours`, label: 'Durée du séjour', icon: '📅' },
                ].map((s,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{s.val}</div>
                      <div style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {/* Voyageurs */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', marginBottom: '.65rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Voyageurs</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                {voyageurs.map((v,i) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? 'var(--green)' : '#6b7cc4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{v.name?.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: '.82rem', fontWeight: 500 }}>{v.name}</div>
                      {i === 0 && <div style={{ fontSize: '.62rem', color: 'var(--green)', fontWeight: 600 }}>Organisateur</div>}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowInvite(true)} style={{ marginTop: '.5rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.78rem', color: 'var(--green)', fontWeight: 500 }}>＋ Inviter un participant</button>
            </div>

            {/* Programme résumé */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Programme du séjour</div>
              {(trip.days || []).slice(0, 6).map(day => {
                const acts = day.activities || []
                const emojis = acts.map(a => a.emoji || (a.title?.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u)?.[0]) || '').filter(Boolean).slice(0, 3)
                return (
                <div key={day.id} style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem', padding: '.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
                  <span style={{ fontWeight: 600, minWidth: 38, flexShrink: 0 }}>{day.label?.split('.')[0]}.</span>
                  {emojis.length > 0 && <span style={{ fontSize: '.8rem', flexShrink: 0 }}>{emojis.join('')}</span>}
                  <span style={{ flex: 1, color: 'var(--text-muted)', minWidth: 0, lineHeight: 1.35 }}>
                    {acts.length > 1 ? `${acts[0]?.title || '—'} +${acts.length - 1}` : (acts[0]?.title || '—')}
                  </span>
                </div>
                )
              })}
              {(trip.days?.length || 0) > 6 && <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', paddingTop: '.3rem' }}>+{trip.days.length - 6} jours...</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── 3 CARDS : Sac / Budget / IA ── */}
      {trip && (
        <div className="dash-bottom-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '.65rem', marginBottom: '1.25rem' }}>
          <div onClick={() => goTrip('sac')} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow .15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
            <div style={{ fontSize: '1.3rem', marginBottom: '.3rem' }}>🎒</div>
            <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: '.1rem' }}>Sac à dos</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{sacDone} / {sacItems.length} objets ajoutés</div>
            <div style={{ fontSize: '.72rem', color: 'var(--green)', marginTop: '.3rem', fontWeight: 500 }}>Voir la checklist →</div>
          </div>

          <div onClick={() => goTrip('budget')} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow .15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
            <div style={{ fontSize: '1.3rem', marginBottom: '.3rem' }}>💰</div>
            <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: '.1rem' }}>Budget</div>
            <div style={{ fontSize: '.88rem', fontWeight: 700 }}>
              {totalSpent > 0 ? `${totalSpent.toFixed(0)} €` : '—'}
              {budget > 0 && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> / {budget} €</span>}
            </div>
            {budget > 0 && <div style={{ height: 4, background: '#eee', borderRadius: 2, marginTop: '.3rem', overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, totalSpent/budget*100)}%`, background: totalSpent > budget ? 'var(--red)' : 'var(--green)', borderRadius: 2 }} /></div>}
            <div style={{ fontSize: '.72rem', color: 'var(--green)', marginTop: '.3rem', fontWeight: 500 }}>Voir le budget →</div>
          </div>

          <div onClick={() => goTrip('ai')} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow .15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
            <div style={{ fontSize: '1.3rem', marginBottom: '.3rem' }}>🤖</div>
            <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: '.1rem' }}>IA Activités</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>Suggestions de parcours adaptés à la météo</div>
            <div style={{ fontSize: '.72rem', color: 'var(--green)', marginTop: '.3rem', fontWeight: 500 }}>Voir les suggestions →</div>
          </div>
        </div>
      )}

      {/* ── MES SÉJOURS (scroll horizontal) ── */}
      {trips.filter(t => !t.archived).length > 1 && (
        <div>
          <div style={{ fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted)', marginBottom: '.55rem' }}>
            Mes séjours ({trips.filter(t => !t.archived).length})
          </div>
          <div style={{ display: 'flex', gap: '.6rem', overflowX: 'auto', paddingBottom: '.5rem', scrollbarWidth: 'thin' }}>
            {trips.filter(t => !t.archived).map(t => {
              const status = getTripStatus(t)
              const isActive = t.id === trip?.id
              const tripPhoto = t.headerPhoto || getFallbackPhoto(t.name, t.destination)
              return (
                <div key={t.id} onClick={() => onSelectTrip(t.id)} style={{
                  flexShrink: 0, width: 200, borderRadius: 14, overflow: 'hidden',
                  border: `2px solid ${isActive ? 'var(--green)' : 'var(--border)'}`,
                  cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all .15s',
                  background: 'var(--card)',
                }}>
                  <div style={{ height: 80, backgroundImage: `url(${tripPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,.4))' }} />
                    <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: '.58rem', fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                      background: status === 'ongoing' ? 'var(--green)' : status === 'upcoming' ? 'var(--blue)' : status === 'closed' ? '#6b5ce7' : '#888',
                      color: '#fff' }}>
                      {status === 'ongoing' ? 'En cours' : status === 'upcoming' ? 'À venir' : status === 'closed' ? '🔒 Clos' : 'Terminé'}
                    </span>
                  </div>
                  <div style={{ padding: '.55rem .65rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: '.1rem' }}>{t.name}</div>
                    <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>
                      {t.destination}
                      {t.startDate && <span> · {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
            <div onClick={onCreateTrip} style={{
              flexShrink: 0, width: 140, borderRadius: 14, border: '2px dashed var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)', transition: 'all .15s', minHeight: 130,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
              <span style={{ fontSize: '1.5rem', marginBottom: '.2rem' }}>＋</span>
              <span style={{ fontSize: '.78rem', fontWeight: 500 }}>Nouveau séjour</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ARCHIVES ── */}
      {archived.length > 0 && (
        <div style={{ marginTop: '.5rem' }}>
          <button onClick={() => setShowArchived(!showArchived)} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.3rem', marginBottom: '.4rem', padding: 0
          }}>
            📦 Archives ({archived.length}) <span style={{ fontSize: '.7rem' }}>{showArchived ? '▼' : '▶'}</span>
          </button>
          {showArchived && (
            <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', paddingBottom: '.5rem', scrollbarWidth: 'thin' }}>
              {archived.map(t => (
                <div key={t.id} style={{
                  flexShrink: 0, width: 180, borderRadius: 12, overflow: 'hidden',
                  border: '1px solid var(--border)', background: 'var(--card)', opacity: .7,
                  cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                }} onClick={() => onSelectTrip(t.id)}>
                  <div style={{ height: 60, backgroundImage: `url(${t.headerPhoto || getFallbackPhoto(t.name, t.destination)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', filter: 'grayscale(.4)' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,.35))' }} />
                    <span style={{ position: 'absolute', bottom: 4, right: 6, fontSize: '.55rem', fontWeight: 600, padding: '1px 5px', borderRadius: 6, background: 'rgba(0,0,0,.5)', color: '#fff' }}>📦 Archivé</span>
                  </div>
                  <div style={{ padding: '.4rem .55rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '.78rem' }}>{t.name}</div>
                    <div style={{ fontSize: '.62rem', color: 'var(--text-muted)' }}>{t.destination}</div>
                    <button onClick={e => { e.stopPropagation(); if (confirm('Désarchiver ce séjour ?')) onUpdateTrip(t.id, { archived: false }) }}
                      style={{ marginTop: '.25rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.65rem', color: 'var(--green)', fontWeight: 500, padding: 0 }}>
                      ↩ Désarchiver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY DETAIL MODAL ── */}
      {selectedAct && (
        <ActivityModal
          act={selectedAct.act}
          dayLabel={selectedAct.dayLabel}
          onClose={() => setSelectedAct(null)}
          onGoTo={() => { setSelectedAct(null); onScrollToDay(selectedAct.dayId) }}
          onValidate={() => {
            if (trip && selectedAct.dayId) {
              const day = trip.days.find(d => d.id === selectedAct.dayId)
              const act = day?.activities?.find(a => a.id === selectedAct.act.id)
              if (act && onUpdateDay) {
                const updatedActs = day.activities.map(a => a.id === act.id ? { ...a, done: !a.done } : a)
                onUpdateDay(selectedAct.dayId, { activities: updatedActs })
                setSelectedAct(prev => ({ ...prev, act: { ...prev.act, done: !prev.act.done } }))
              }
            }
          }}
        />
      )}

      {/* ── MODAL INVITATION ── */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
          <div style={{ background: '#fff', borderRadius: 18, padding: '1.5rem', maxWidth: 420, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,.2)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '.25rem' }}>🔗 Inviter des participants</h2>
            <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Génère un lien de partage pour que tes amis rejoignent le séjour.</p>
            <InviteGenerator tripId={trip?.id} tripName={trip?.name} ownerUid={uid} />
            <button onClick={() => setShowInvite(false)} style={{ marginTop: '.75rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.82rem', color: 'var(--text-muted)' }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}

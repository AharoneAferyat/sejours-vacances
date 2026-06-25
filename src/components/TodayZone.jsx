import { useState, useEffect, useRef } from 'react'
import { formatCountdown, getTodayStr, getMsTripStart, getTripStatus, formatDate } from '../utils'

function ChronoBox({ day }) {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const toMin = t => { const m = t?.match(/^(\d{1,2}):(\d{2})$/); return m ? parseInt(m[1])*60+parseInt(m[2]) : -1 }

  const chrono = day.activities
    .flatMap(act => [
      act.startTime && { t: act.startTime, txt: `${act.emoji} ${act.title}` },
      act.endTime && { t: act.endTime, txt: `↩ Fin — ${act.title}` },
    ].filter(Boolean))
    .sort((a, b) => a.t.localeCompare(b.t))

  if (!chrono.length) return null

  return (
    <div className="chrono-box">
      <div className="chrono-box-title">⏰ Chrono</div>
      {chrono.map((c, i) => {
        const cm = toMin(c.t)
        const isNow = cm > 0 && cm <= nowMin && (i === chrono.length-1 || toMin(chrono[i+1]?.t) > nowMin)
        return (
          <div key={i} className="chrono-row">
            <span className="chrono-time">{c.t}</span>
            <span className={`chrono-dot${isNow ? ' now' : ''}`} />
            <span className="chrono-text">{c.txt}</span>
          </div>
        )
      })}
    </div>
  )
}

// POST-TRIP: highlights with photo upload
function PostTripHighlights({ trip, onUpdateDay }) {
  const fileInputRef = useRef()
  const [selectedDayId, setSelectedDayId] = useState(null)

  const allActivities = trip.days.flatMap(d =>
    d.activities.map(a => ({ ...a, dayLabel: d.label, dayId: d.id, dayValidated: d.validated }))
  )
  const done = allActivities.filter(a => a.done)
  const notDone = allActivities.filter(a => !a.done)

  const handlePhoto = (e, dayId) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const day = trip.days.find(d => d.id === dayId)
      if (!day) return
      const photos = [...(day.photos || []), ev.target.result]
      onUpdateDay(dayId, { photos })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ background: 'var(--gray)', color: '#fff', margin: '.75rem 1rem', borderRadius: 'var(--radius)', padding: '1.1rem' }}>
      <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', opacity: .7, marginBottom: '.4rem' }}>
        🏁 Séjour terminé — {trip.name}
      </div>
      <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '.75rem' }}>
        {done.length}/{allActivities.length} activité{allActivities.length > 1 ? 's' : ''} réalisée{done.length > 1 ? 's' : ''} 🎉
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .7, marginBottom: '.4rem' }}>✅ Réalisé</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
            {done.map(a => (
              <span key={a.id} style={{ background: 'rgba(255,255,255,.2)', padding: '3px 10px', borderRadius: 20, fontSize: '.75rem' }}>
                {a.emoji} {a.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Not done */}
      {notDone.length > 0 && (
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .7, marginBottom: '.4rem' }}>⏭ Pas fait</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
            {notDone.map(a => (
              <span key={a.id} style={{ background: 'rgba(255,255,255,.1)', padding: '3px 10px', borderRadius: 20, fontSize: '.75rem', opacity: .7, textDecoration: 'line-through' }}>
                {a.emoji} {a.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Photos by day */}
      <div>
        <div style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .7, marginBottom: '.5rem' }}>📸 Photos</div>
        {trip.days.map(day => (
          <div key={day.id} style={{ marginBottom: '.65rem' }}>
            <div style={{ fontSize: '.75rem', opacity: .75, marginBottom: '.35rem' }}>{day.label}</div>
            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {(day.photos || []).map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '2px solid rgba(255,255,255,.2)' }} />
              ))}
              <label style={{
                width: 64, height: 64, borderRadius: 8, border: '2px dashed rgba(255,255,255,.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '1.2rem', color: 'rgba(255,255,255,.5)', flexShrink: 0,
              }}>
                ＋
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhoto(e, day.id)} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TodayZone({ trip, onUpdateDay }) {
  const [countdown, setCountdown] = useState('')
  const status = getTripStatus(trip)
  const today = getTodayStr()
  const todayDay = trip.days.find(d => d.date === today)
  const daysLeft = trip.days.filter(d => d.date > today).length

  useEffect(() => {
    if (status !== 'upcoming') return
    const tick = () => {
      const ms = getMsTripStart(trip)
      setCountdown(ms > 0 ? formatCountdown(ms) : '')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [trip, status])

  // POST-TRIP
  if (status === 'past') {
    return <PostTripHighlights trip={trip} onUpdateDay={onUpdateDay} />
  }

  // PRE-TRIP
  if (status === 'upcoming') {
    return (
      <div className="today-card" style={{ background: trip.color || 'var(--green)' }}>
        <div className="today-label">🗓 Avant le séjour — {trip.name}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 600, marginBottom: '.2rem' }}>{countdown}</div>
        <div style={{ fontSize: '.73rem', opacity: .75, marginBottom: '.9rem' }}>
          avant le départ · {new Date(trip.startDate+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </div>
        <div className="chrono-box">
          <div className="chrono-box-title">📋 Programme</div>
          {trip.days.map(d => (
            <div key={d.id} style={{ display:'flex',alignItems:'center',gap:'.5rem',padding:'.3rem 0',borderBottom:'1px solid rgba(255,255,255,.1)',fontSize:'.78rem' }}>
              <span>{d.activities[0]?.emoji || '📅'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{d.label}</div>
                <div style={{ opacity: .7, fontSize: '.72rem' }}>{d.activities.map(a => a.title).join(' · ') || '—'}</div>
              </div>
              {d.activities.reduce((s,a) => s+(a.distanceKm||0), 0) > 0 && (
                <span style={{ opacity: .6, fontSize: '.7rem' }}>{d.activities.reduce((s,a) => s+(a.distanceKm||0), 0)}km</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ACTIVE — today
  if (!todayDay) return null

  const chips = todayDay.activities.flatMap(a => [
    a.distanceKm > 0 && `📍 ${a.distanceKm}km`,
    a.dplus > 0 && `⬆️ ${a.dplus}m D+`,
    ...(a.features||[]).map(f => ({lac:'🏞 Lac',cascade:'💦 Cascade',faune:'🦌 Faune',vue:'🔭 Vue'})[f]).filter(Boolean),
  ]).filter(Boolean)

  return (
    <div className="today-card" style={{ background: trip.color || 'var(--green)' }}>
      <div className="today-label">
        📅 Aujourd'hui · {todayDay.label}
        {daysLeft > 0 ? ` · ${daysLeft} jour${daysLeft>1?'s':''} restant${daysLeft>1?'s':''}` : ' · Dernier jour !'}
      </div>
      <div className="today-title">
        {todayDay.activities.map(a => a.emoji).join(' ')} {todayDay.activities.map(a => a.title).join(' + ') || todayDay.label}
      </div>
      {chips.length > 0 && (
        <div className="today-chips">{chips.map((c,i) => <span key={i} className="today-chip">{c}</span>)}</div>
      )}
      <ChronoBox day={todayDay} />
      {todayDay.activities.flatMap(a => a.links||[]).length > 0 && (
        <div style={{ display:'flex',gap:'.35rem',flexWrap:'wrap' }}>
          {todayDay.activities.flatMap(a => a.links||[]).map((l,i) => (
            <a key={i} href={l.url} target="_blank" rel="noreferrer"
              style={{ background:'rgba(255,255,255,.2)',color:'#fff',fontSize:'.72rem',padding:'4px 10px',borderRadius:7,textDecoration:'none',fontWeight:500 }}>
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

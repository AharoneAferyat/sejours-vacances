import { useState, useEffect, useRef } from 'react'
import { formatCountdown, getTodayStr, getMsTripStart, getTripStatus, formatDuration, calcDayStats } from '../utils'
import { generateAlerts, ALERT_STYLES } from '../utils/alerts'

// ── ALERTS ────────────────────────────────────────────────────────────────
function AlertsBlock({ day, weather }) {
  const alerts = generateAlerts(day, weather)
  if (!alerts.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', marginBottom: '.75rem' }}>
      {alerts.map((a, i) => {
        const s = ALERT_STYLES[a.level]
        return (
          <div key={i} style={{
            background: 'rgba(255,255,255,.15)',
            borderLeft: `3px solid rgba(255,255,255,.6)`,
            borderRadius: '0 8px 8px 0',
            padding: '.45rem .75rem',
            fontSize: '.76rem',
            display: 'flex', alignItems: 'center', gap: '.45rem'
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{a.icon}</span>
            <span style={{ opacity: .95 }}>{a.text}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── STATS BAR ──────────────────────────────────────────────────────────────
function StatsBar({ trip, color }) {
  const allActs = trip.days.flatMap(d => d.activities)
  const stats = calcDayStats(allActs)
  if (stats.totalKm === 0 && stats.totalDplus === 0) return null
  return (
    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
      {stats.totalKm > 0 && <span style={{ background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 20, fontSize: '.73rem', whiteSpace: 'nowrap' }}>📍 {stats.totalKm} km au total</span>}
      {stats.totalDplus > 0 && <span style={{ background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 20, fontSize: '.73rem', whiteSpace: 'nowrap' }}>⬆️ {stats.totalDplus} m D+</span>}
      {stats.totalMin > 0 && <span style={{ background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 20, fontSize: '.73rem', whiteSpace: 'nowrap' }}>⏱ {formatDuration(stats.totalMin)} d'activités</span>}
      <span style={{ background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 20, fontSize: '.73rem', whiteSpace: 'nowrap' }}>🗓 {trip.days.length} jours</span>
    </div>
  )
}

// ── PROGRAMME MINI (avant le séjour) ──────────────────────────────────────
function ProgrammeList({ trip }) {
  return (
    <div className="chrono-box">
      <div className="chrono-box-title">📋 Programme</div>
      {trip.days.map(d => {
        const dayStats = calcDayStats(d.activities)
        return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', padding: '.35rem 0', borderBottom: '1px solid rgba(255,255,255,.08)', fontSize: '.78rem' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{d.activities[0]?.emoji || '📅'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{d.label}</div>
              <div style={{ opacity: .7, fontSize: '.71rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.activities.map(a => a.title).join(' · ') || '—'}
              </div>
            </div>
            {dayStats.totalKm > 0 && <span style={{ opacity: .6, fontSize: '.7rem', flexShrink: 0 }}>{dayStats.totalKm}km</span>}
            {dayStats.totalDplus > 0 && <span style={{ opacity: .6, fontSize: '.7rem', flexShrink: 0 }}>↑{dayStats.totalDplus}m</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── DAY DETAIL (aujourd'hui ou demain) ────────────────────────────────────
function DayDetail({ day, label, color, isToday }) {
  if (!day) return null
  const stats = calcDayStats(day.activities)

  return (
    <div>
      <div className="today-label">{label}</div>
      <div className="today-title">
        {day.activities.map(a => a.emoji).join(' ')} {day.activities.map(a => a.title).join(' + ') || day.label}
      </div>

      {/* Stats du jour */}
      {(stats.totalKm > 0 || stats.totalDplus > 0) && (
        <div className="today-chips" style={{ marginBottom: '.6rem' }}>
          {stats.totalKm > 0 && <span className="today-chip">📍 {stats.totalKm} km</span>}
          {stats.totalDplus > 0 && <span className="today-chip">⬆️ {stats.totalDplus} m D+</span>}
          {stats.totalMin > 0 && <span className="today-chip">⏱ {formatDuration(stats.totalMin)}</span>}
          {day.activities.flatMap(a => a.features || []).filter((f, i, arr) => arr.indexOf(f) === i).map(f => (
            <span key={f} className="today-chip">{{ lac: '🏞 Lac', cascade: '💦 Cascade', faune: '🦌 Faune', vue: '🔭 Vue' }[f] || f}</span>
          ))}
        </div>
      )}

      {/* Chrono */}
      {(() => {
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
            <div className="chrono-box-title">{isToday ? '⏰ Aujourd\'hui' : '⏰ Programme de demain'}</div>
            {chrono.map((c, i) => {
              const cm = toMin(c.t)
              const isNow = isToday && cm > 0 && cm <= nowMin && (i === chrono.length-1 || toMin(chrono[i+1]?.t) > nowMin)
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
      })()}

      {/* Matériel */}
      {day.activities.some(a => a.gear?.length > 0) && (
        <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 9, padding: '.6rem .85rem', marginBottom: '.6rem' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .7, marginBottom: '.35rem' }}>🎒 {isToday ? 'Matériel' : 'Prépare demain'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem' }}>
            {[...new Set(day.activities.flatMap(a => a.gear || []))].slice(0, 8).map((g, i) => (
              <span key={i} style={{ background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '2px 8px', fontSize: '.7rem' }}>{g}</span>
            ))}
          </div>
        </div>
      )}

      {/* Liens */}
      {day.activities.flatMap(a => a.links || []).length > 0 && (
        <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
          {day.activities.flatMap(a => a.links || []).map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noreferrer"
              style={{ background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: '.72rem', padding: '4px 10px', borderRadius: 7, textDecoration: 'none', fontWeight: 500 }}>
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ── POST-TRIP HIGHLIGHTS ───────────────────────────────────────────────────
function PostTripHighlights({ trip, onUpdateDay }) {
  const fileInputRef = useRef()
  const [activeDay, setActiveDay] = useState(null)

  const allActs = trip.days.flatMap(d => d.activities.map(a => ({ ...a, dayLabel: d.label })))
  const done = allActs.filter(a => a.done)
  const notDone = allActs.filter(a => !a.done)
  const stats = calcDayStats(trip.days.flatMap(d => d.activities.filter(a => a.done)))

  const handlePhoto = (e, dayId) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const day = trip.days.find(d => d.id === dayId)
      if (!day) return
      onUpdateDay(dayId, { photos: [...(day.photos || []), ev.target.result] })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="today-card" style={{ background: '#1a2a1a' }}>
      <div className="today-label">🏁 Séjour terminé — {trip.name}</div>
      <div className="today-title">{done.length}/{allActs.length} activités réalisées 🎉</div>

      {/* Stats réalisées */}
      {stats.totalKm > 0 && (
        <div className="today-chips" style={{ marginBottom: '.75rem' }}>
          {stats.totalKm > 0 && <span className="today-chip">📍 {stats.totalKm} km parcourus</span>}
          {stats.totalDplus > 0 && <span className="today-chip">⬆️ {stats.totalDplus} m D+</span>}
          {stats.totalMin > 0 && <span className="today-chip">⏱ {formatDuration(stats.totalMin)}</span>}
        </div>
      )}

      {/* Réalisé */}
      {done.length > 0 && (
        <div style={{ marginBottom: '.65rem' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', opacity: .65, marginBottom: '.35rem' }}>✅ Réalisé</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
            {done.map(a => <span key={a.id} style={{ background: 'rgba(255,255,255,.18)', padding: '3px 9px', borderRadius: 20, fontSize: '.74rem' }}>{a.emoji} {a.title}</span>)}
          </div>
        </div>
      )}

      {/* Pas fait */}
      {notDone.length > 0 && (
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', opacity: .65, marginBottom: '.35rem' }}>⏭ Pas fait</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
            {notDone.map(a => <span key={a.id} style={{ background: 'rgba(255,255,255,.08)', padding: '3px 9px', borderRadius: 20, fontSize: '.74rem', opacity: .6, textDecoration: 'line-through' }}>{a.emoji} {a.title}</span>)}
          </div>
        </div>
      )}

      {/* Photos par jour */}
      <div>
        <div style={{ fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', opacity: .65, marginBottom: '.5rem' }}>📸 Photos du séjour</div>
        {trip.days.map(day => (
          <div key={day.id} style={{ marginBottom: '.65rem' }}>
            <div style={{ fontSize: '.73rem', opacity: .7, marginBottom: '.3rem' }}>{day.label}</div>
            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {(day.photos || []).map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '2px solid rgba(255,255,255,.2)' }} />
              ))}
              <label style={{ width: 60, height: 60, borderRadius: 8, border: '2px dashed rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.3rem', color: 'rgba(255,255,255,.4)' }}>
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

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function TodayZone({ trip, tomorrowWeather, onUpdateDay }) {
  const [countdown, setCountdown] = useState('')
  const status = getTripStatus(trip)
  const today = getTodayStr()

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

  const color = trip.color || '#0F6E56'

  // ── POST-TRIP ──────────────────────────────────────────────────────────
  if (status === 'past') {
    return <PostTripHighlights trip={trip} onUpdateDay={onUpdateDay} />
  }

  // ── BEFORE TRIP ────────────────────────────────────────────────────────
  if (status === 'upcoming') {
    return (
      <div className="today-card" style={{ background: color }}>
        <div className="today-label">🗓 Avant le séjour — {trip.name}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 600, marginBottom: '.15rem' }}>{countdown}</div>
        <div style={{ fontSize: '.73rem', opacity: .75, marginBottom: '.85rem' }}>
          avant le départ · {new Date(trip.startDate+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </div>
        <StatsBar trip={trip} />
        <ProgrammeList trip={trip} />
      </div>
    )
  }

  // ── DURING TRIP ────────────────────────────────────────────────────────
  const todayDay = trip.days.find(d => d.date === today)
  const tomorrowDate = (() => {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${day}`
  })()
  const tomorrowDay = trip.days.find(d => d.date === tomorrowDate)
  const daysLeft = trip.days.filter(d => d.date > today).length

  // After sunset (or 18h fallback): show tomorrow's info if available
  const nowH = new Date().getHours()
  // Approximate sunset: earlier in winter (~17h), later in summer (~21h)
  const month = new Date().getMonth() + 1 // 1-12
  const approxSunset = month >= 4 && month <= 9 ? 20 : 17 // summer vs winter
  const switchHour = Math.min(approxSunset, 20) // never later than 20h
  const showTomorrow = nowH >= switchHour && tomorrowDay

  const label = showTomorrow
    ? `📅 Demain · ${tomorrowDay.label} · ${daysLeft > 0 ? `${daysLeft} jour${daysLeft>1?'s':''} restant${daysLeft>1?'s':''}` : 'Dernier jour !'}`
    : `📅 Aujourd'hui · ${todayDay?.label || today} · ${daysLeft > 0 ? `${daysLeft} jour${daysLeft>1?'s':''} restant${daysLeft>1?'s':''}` : 'Dernier jour !'}`

  const displayDay = showTomorrow ? tomorrowDay : todayDay

  if (!displayDay) return null

  return (
    <div className="today-card" style={{ background: color }}>
      <>
        <DayDetail
          day={displayDay}
          label={label}
          color={color}
          isToday={!showTomorrow}
        />
        {showTomorrow && tomorrowWeather && (
          <AlertsBlock day={tomorrowDay} weather={tomorrowWeather} />
        )}
      </>
    </div>
  )
}

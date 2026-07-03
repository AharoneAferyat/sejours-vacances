import { useState } from 'react'
import TodayZone from './TodayZone'

function getTripStatus(trip) {
  if (!trip.startDate) return 'unknown'
  const today = new Date().toISOString().slice(0, 10)
  if (today < trip.startDate) return 'upcoming'
  if (today > trip.endDate) return 'past'
  return 'ongoing'
}

function getCountdown(startDate) {
  const now = new Date()
  const start = new Date(startDate + 'T00:00:00')
  const diff = start - now
  if (diff <= 0) return null
  const j = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  return `${j}j ${h}h`
}

export default function Dashboard({ trips, onSelectTrip, onCreateTrip, userName, activeTrip, tomorrowWeather, onUpdateDay, setTab }) {
  const upcoming = trips.filter(t => getTripStatus(t) === 'upcoming').sort((a, b) => a.startDate?.localeCompare(b.startDate))
  const ongoing = trips.filter(t => getTripStatus(t) === 'ongoing')
  const past = trips.filter(t => getTripStatus(t) === 'past').sort((a, b) => b.endDate?.localeCompare(a.endDate))
  const nextTrip = ongoing[0] || upcoming[0]

  if (trips.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '3rem auto', textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '.75rem' }}>🥾</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '.5rem' }}>
          {userName ? `Bienvenue, ${userName} !` : 'Bienvenue !'}
        </h1>
        <p style={{ fontSize: '.92rem', color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Planifie tes randonnées et séjours de A à Z — météo, activités, budget, valise.
        </p>
        <button onClick={onCreateTrip} style={{
          background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 14,
          padding: '.9rem 2.5rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(47,143,107,.35)',
        }}>＋ Créer mon premier séjour</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.25rem 1.5rem 3rem' }}>

      {/* ── GREETING BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 700, marginBottom: '.15rem' }}>
            {userName ? `Salut, ${userName} 👋` : 'Tableau de bord'}
          </h1>
          <p style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>
            {ongoing.length ? `${ongoing.length} séjour en cours` : upcoming.length ? `${upcoming.length} séjour${upcoming.length > 1 ? 's' : ''} à venir` : 'Tous tes séjours sont terminés'}
          </p>
        </div>
        <button onClick={onCreateTrip} style={{
          background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 10,
          padding: '8px 16px', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(47,143,107,.2)',
        }}>＋ Nouveau séjour</button>
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div className="dashboard-grid">

        {/* COLONNE GAUCHE — Prochain séjour + Hype Up */}
        <div className="dashboard-left">

          {/* Prochain séjour — carte hero */}
          {nextTrip && (
            <div onClick={() => onSelectTrip(nextTrip.id)} style={{
              background: `linear-gradient(135deg, ${nextTrip.color || 'var(--green)'} 0%, ${nextTrip.color || '#1D9E75'}dd 100%)`,
              color: '#fff', borderRadius: 16, padding: '1.15rem 1.3rem', marginBottom: '.85rem',
              cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,.12)',
              transition: 'transform .15s', position: 'relative', overflow: 'hidden'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ position: 'absolute', top: '-40%', right: '-15%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
              <div style={{ fontSize: '.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .7, marginBottom: '.3rem' }}>
                {getTripStatus(nextTrip) === 'ongoing' ? '🟢 En cours' : '📅 Prochain séjour'}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '.15rem' }}>{nextTrip.name}</div>
              {nextTrip.destination && <div style={{ fontSize: '.78rem', opacity: .8, marginBottom: '.4rem' }}>📍 {nextTrip.destination}</div>}
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {nextTrip.startDate && (
                  <span style={{ background: 'rgba(255,255,255,.18)', borderRadius: 16, padding: '2px 9px', fontSize: '.72rem', fontWeight: 500 }}>
                    {new Date(nextTrip.startDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(nextTrip.endDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                {getTripStatus(nextTrip) === 'upcoming' && getCountdown(nextTrip.startDate) && (
                  <span style={{ background: 'rgba(255,255,255,.22)', borderRadius: 16, padding: '2px 9px', fontSize: '.72rem', fontWeight: 600 }}>⏳ {getCountdown(nextTrip.startDate)}</span>
                )}
              </div>
              <div style={{ fontSize: '.72rem', opacity: .5, marginTop: '.4rem', textAlign: 'right' }}>Ouvrir →</div>
            </div>
          )}

          {/* Hype Up */}
          {activeTrip && (
            <TodayZone trip={activeTrip} tomorrowWeather={tomorrowWeather} onUpdateDay={onUpdateDay} />
          )}
        </div>

        {/* COLONNE DROITE — Liste séjours + actions */}
        <div className="dashboard-right">

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.85rem' }}>
            {[
              { icon: '📋', label: 'Planning', action: () => { if (activeTrip) { onSelectTrip(activeTrip.id); setTab?.('planning') } } },
              { icon: '💰', label: 'Budget', action: () => { if (activeTrip) { onSelectTrip(activeTrip.id); setTab?.('budget') } } },
              { icon: '🧳', label: 'Valise', action: () => { if (activeTrip) { onSelectTrip(activeTrip.id); setTab?.('valise') } } },
              { icon: '🤖', label: 'IA Activités', action: () => { if (activeTrip) { onSelectTrip(activeTrip.id); setTab?.('ai') } } },
            ].map((a, i) => (
              <button key={i} onClick={a.action} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
                padding: '.65rem .75rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '.4rem', fontFamily: 'inherit', fontSize: '.8rem', fontWeight: 500,
                color: 'var(--text)', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
                <span style={{ fontSize: '1.1rem' }}>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>

          {/* Liste des séjours */}
          <div style={{ marginBottom: '.85rem' }}>
            <div style={{ fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              Mes séjours ({trips.length})
            </div>
            {trips.map(t => {
              const status = getTripStatus(t)
              const countdown = status === 'upcoming' ? getCountdown(t.startDate) : null
              const isActive = t.id === activeTrip?.id
              return (
                <div key={t.id} onClick={() => onSelectTrip(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '.65rem',
                  background: isActive ? 'var(--green-light)' : 'var(--card)',
                  border: `1px solid ${isActive ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '.7rem .85rem', marginBottom: '.4rem',
                  cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all .15s',
                  borderLeft: `4px solid ${t.color || 'var(--green)'}`,
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.1rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{t.name}</span>
                      {isActive && <span style={{ fontSize: '.55rem', background: 'var(--green)', color: '#fff', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>Actif</span>}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                      {t.destination && <span>📍 {t.destination}</span>}
                      {t.startDate && <span>{new Date(t.startDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(t.endDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <span style={{
                      fontSize: '.6rem', fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                      background: status === 'ongoing' ? 'var(--green-light)' : status === 'upcoming' ? 'var(--blue-light)' : '#f0efe8',
                      color: status === 'ongoing' ? 'var(--green)' : status === 'upcoming' ? 'var(--blue)' : 'var(--text-muted)',
                    }}>
                      {status === 'ongoing' ? 'En cours' : status === 'upcoming' ? 'À venir' : 'Terminé'}
                    </span>
                    {countdown && <div style={{ fontSize: '.68rem', fontWeight: 600, color: 'var(--blue)', marginTop: '.15rem' }}>⏳ {countdown}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Souvenirs */}
          {past.length > 0 && (
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
                📸 Souvenirs
              </div>
              <div style={{ display: 'flex', gap: '.45rem', overflowX: 'auto', paddingBottom: '.25rem', scrollbarWidth: 'none' }}>
                {past.map(t => (
                  <div key={t.id} onClick={() => onSelectTrip(t.id)} style={{
                    flexShrink: 0, width: 150, background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '.6rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '.78rem', marginBottom: '.1rem' }}>{t.name}</div>
                    <div style={{ fontSize: '.67rem', color: 'var(--text-muted)' }}>
                      {t.startDate && new Date(t.startDate + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'

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

export default function Dashboard({ trips, onSelectTrip, onCreateTrip, userName }) {
  const upcoming = trips.filter(t => getTripStatus(t) === 'upcoming').sort((a, b) => a.startDate?.localeCompare(b.startDate))
  const ongoing = trips.filter(t => getTripStatus(t) === 'ongoing')
  const past = trips.filter(t => getTripStatus(t) === 'past').sort((a, b) => b.endDate?.localeCompare(a.endDate))
  const nextTrip = ongoing[0] || upcoming[0]

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

      {/* Salutation */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)', fontWeight: 700, color: 'var(--text)', marginBottom: '.3rem' }}>
          {userName ? `Salut, ${userName} 👋` : 'Bienvenue ! 👋'}
        </h1>
        <p style={{ fontSize: '.88rem', color: 'var(--text-muted)' }}>
          {trips.length === 0 ? 'Prêt à planifier ton premier séjour ?' :
           nextTrip ? `Ton prochain séjour approche !` : 'Tous tes séjours sont terminés — prêt pour le prochain ?'}
        </p>
      </div>

      {/* Prochain séjour — mis en avant */}
      {nextTrip && (
        <div onClick={() => onSelectTrip(nextTrip.id)} style={{
          background: 'linear-gradient(135deg, var(--green) 0%, #1D9E75 100%)', color: '#fff',
          borderRadius: 18, padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
          cursor: 'pointer', boxShadow: '0 8px 32px rgba(47,143,107,.25)',
          transition: 'transform .15s', position: 'relative', overflow: 'hidden'
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
          <div style={{ fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .75, marginBottom: '.4rem' }}>
            {getTripStatus(nextTrip) === 'ongoing' ? '🟢 En cours' : '📅 Prochain séjour'}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '.2rem' }}>
            {nextTrip.name}
          </div>
          {nextTrip.destination && <div style={{ fontSize: '.82rem', opacity: .85, marginBottom: '.5rem' }}>📍 {nextTrip.destination}</div>}
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {nextTrip.startDate && (
              <span style={{ background: 'rgba(255,255,255,.18)', borderRadius: 20, padding: '3px 10px', fontSize: '.75rem', fontWeight: 500 }}>
                {new Date(nextTrip.startDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(nextTrip.endDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {getTripStatus(nextTrip) === 'upcoming' && getCountdown(nextTrip.startDate) && (
              <span style={{ background: 'rgba(255,255,255,.18)', borderRadius: 20, padding: '3px 10px', fontSize: '.75rem', fontWeight: 600 }}>
                ⏳ {getCountdown(nextTrip.startDate)}
              </span>
            )}
            {nextTrip.days && (
              <span style={{ fontSize: '.75rem', opacity: .7 }}>
                {nextTrip.days.length} jours · {nextTrip.days.reduce((s, d) => s + (d.activities?.length || 0), 0)} activités
              </span>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: '.8rem', right: '1rem', fontSize: '.78rem', opacity: .6 }}>Ouvrir →</div>
        </div>
      )}

      {/* Tous les séjours */}
      {trips.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted)', marginBottom: '.65rem' }}>
            Mes séjours ({trips.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '.65rem' }}>
            {trips.map(t => {
              const status = getTripStatus(t)
              const countdown = status === 'upcoming' ? getCountdown(t.startDate) : null
              return (
                <div key={t.id} onClick={() => onSelectTrip(t.id)} style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
                  padding: '.85rem 1rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                  transition: 'box-shadow .15s, transform .15s',
                  borderLeft: `4px solid ${t.color || 'var(--green)'}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{t.name}</span>
                    <span style={{
                      fontSize: '.6rem', fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                      background: status === 'ongoing' ? 'var(--green-light)' : status === 'upcoming' ? 'var(--blue-light)' : '#f5f4f0',
                      color: status === 'ongoing' ? 'var(--green)' : status === 'upcoming' ? 'var(--blue)' : 'var(--text-muted)',
                    }}>
                      {status === 'ongoing' ? '🟢 En cours' : status === 'upcoming' ? '📅 À venir' : '✅ Terminé'}
                    </span>
                  </div>
                  {t.destination && <div style={{ fontSize: '.76rem', color: 'var(--text-muted)', marginBottom: '.2rem' }}>📍 {t.destination}</div>}
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', fontSize: '.7rem', color: 'var(--text-muted)' }}>
                    {t.startDate && <span>{new Date(t.startDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(t.endDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                    {countdown && <span style={{ fontWeight: 600, color: 'var(--blue)' }}>⏳ {countdown}</span>}
                  </div>
                </div>
              )
            })}
            {/* Bouton créer */}
            <div onClick={onCreateTrip} style={{
              background: 'transparent', border: '2px dashed var(--border)', borderRadius: 14,
              padding: '.85rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', minHeight: 100,
              transition: 'border-color .15s, background .15s', color: 'var(--text-muted)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = 'var(--green-light)'; e.currentTarget.style.color = 'var(--green)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}>
              <span style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>＋</span>
              <span style={{ fontSize: '.82rem', fontWeight: 500 }}>Nouveau séjour</span>
            </div>
          </div>
        </div>
      )}

      {/* Séjours passés — souvenirs */}
      {past.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted)', marginBottom: '.65rem' }}>
            📸 Souvenirs ({past.length})
          </h2>
          <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', paddingBottom: '.3rem', scrollbarWidth: 'none' }}>
            {past.map(t => (
              <div key={t.id} onClick={() => onSelectTrip(t.id)} style={{
                flexShrink: 0, width: 180, background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '.75rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: '.15rem' }}>{t.name}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
                  {t.destination}
                  {t.startDate && <span> · {new Date(t.startDate + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pas de séjour du tout */}
      {trips.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '.75rem' }}>🥾</div>
          <p style={{ fontSize: '.92rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Planifie tes randonnées et séjours de A à Z<br/>météo, activités, budget, valise — tout au même endroit.
          </p>
          <button onClick={onCreateTrip} style={{
            background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 14,
            padding: '.85rem 2rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(47,143,107,.35)',
          }}>
            ＋ Créer mon premier séjour
          </button>
        </div>
      )}
    </div>
  )
}

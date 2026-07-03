import { useState, useEffect } from 'react'

function getTripStatus(trip) {
  if (!trip.startDate) return 'unknown'
  const today = new Date().toISOString().slice(0,10)
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
  const m = Math.floor((diff % 3600000) / 60000)
  return { j, h, m, text: `${j}j ${h}h ${m}m` }
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
        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.3rem' }}>Partage ce lien avec tes compagnons de voyage</div>
        <button onClick={() => setUrl(null)} style={{ marginTop: '.3rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.72rem', color: 'var(--text-muted)' }}>🔄 Générer un nouveau lien</button>
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

export default function Dashboard({ trips, onSelectTrip, onCreateTrip, userName, activeTrip, tomorrowWeather, onUpdateDay, setTab, uid }) {
  const [time, setTime] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [showInvite, setShowInvite] = useState(false)

  const upcoming = trips.filter(t => getTripStatus(t)==='upcoming').sort((a,b) => a.startDate?.localeCompare(b.startDate))
  const ongoing = trips.filter(t => getTripStatus(t)==='ongoing')
  const past = trips.filter(t => getTripStatus(t)==='past')
  const nextTrip = ongoing[0] || upcoming[0]
  const trip = activeTrip || nextTrip || trips[0]

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}))
      if (trip?.startDate) setCountdown(getCountdown(trip.startDate))
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
                {getTripStatus(hero) === 'ongoing' ? '🟢 Séjour en cours' : '📅 Prochain séjour'}
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
            {/* Countdown */}
            {countdown && countdown.j >= 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', marginBottom: '.65rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.4rem' }}>⏳ Avant le départ</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginBottom: '.15rem' }}>{countdown.j}j {countdown.h}h {countdown.m}m</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                  {new Date(trip.startDate+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </div>
              </div>
            )}

            {/* Statistiques */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Statistiques</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
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
              {(trip.days || []).slice(0, 6).map(day => (
                <div key={day.id} style={{ display: 'flex', alignItems: 'baseline', gap: '.5rem', padding: '.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
                  <span style={{ fontWeight: 600, minWidth: 60 }}>{day.label?.split('.')[0]}.</span>
                  <span style={{ flex: 1, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {day.activities?.[0]?.title || day.activities?.[0]?.subtitle || '—'}
                  </span>
                  {day.activities?.[0]?.distanceKm && <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{day.activities[0].distanceKm}km</span>}
                </div>
              ))}
              {(trip.days?.length || 0) > 6 && <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', paddingTop: '.3rem' }}>+{trip.days.length - 6} jours...</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── 3 CARDS : Sac / Budget / IA ── */}
      {trip && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '.65rem', marginBottom: '1.25rem' }}>
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
      {trips.length > 1 && (
        <div>
          <div style={{ fontSize: '.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted)', marginBottom: '.55rem' }}>
            Mes séjours ({trips.length})
          </div>
          <div style={{ display: 'flex', gap: '.6rem', overflowX: 'auto', paddingBottom: '.5rem', scrollbarWidth: 'thin' }}>
            {trips.map(t => {
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
                      background: status === 'ongoing' ? 'var(--green)' : status === 'upcoming' ? 'var(--blue)' : '#888',
                      color: '#fff' }}>
                      {status === 'ongoing' ? 'En cours' : status === 'upcoming' ? 'À venir' : 'Terminé'}
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

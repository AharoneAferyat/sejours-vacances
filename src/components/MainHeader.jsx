import { useState, useEffect, useRef } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

const PHOTOS = {
  mountain: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&fit=crop',
  beach:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80&fit=crop',
  city:     'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80&fit=crop',
  forest:   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80&fit=crop',
  lake:     'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1600&q=80&fit=crop',
  default:  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80&fit=crop',
}

function getPhoto(name='', dest='') {
  const t = (name + ' ' + dest).toLowerCase()
  if (/mont|alp|isère|savoie|chamonix|montagne|ski|neige|glacier/.test(t)) return PHOTOS.mountain
  if (/mer|plage|côte|méditerranée|sea|corse|bretagne/.test(t)) return PHOTOS.beach
  if (/paris|lyon|marseille|bordeaux|ville|city/.test(t)) return PHOTOS.city
  if (/forêt|bois|parc|arbre/.test(t)) return PHOTOS.forest
  if (/lac|rivière|cascade|gorge/.test(t)) return PHOTOS.lake
  return PHOTOS.default
}

function getBg() {
  const h = new Date().getHours(), m = new Date().getMonth()
  const su=m>=5&&m<=8, wi=m===11||m<=1, sp=m>=2&&m<=4
  if(h<5)  return wi?'linear-gradient(160deg,#0a0a1a,#0d1b3e,#1a0a2e)':'linear-gradient(160deg,#070714,#0d1533,#0a0d1f)'
  if(h<7)  return su?'linear-gradient(160deg,#1a1535,#8b3a62,#e8852f)':sp?'linear-gradient(160deg,#1a1040,#6b2d6b,#d4722a)':wi?'linear-gradient(160deg,#1a1030,#3d1c5e,#7a3b1e)':'linear-gradient(160deg,#1a1030,#5c2d6b,#c4622a)'
  if(h<12) return su?'linear-gradient(160deg,#1a3a6e,#1e6bb5,#38a0d4)':sp?'linear-gradient(160deg,#1a4a2e,#2d7a4f,#4aab72)':wi?'linear-gradient(160deg,#1e3a5f,#2d5986,#4a7fa8)':'linear-gradient(160deg,#2a3a50,#3d5a78,#5a7fa0)'
  if(h<17) return su?'linear-gradient(160deg,#0a3a7a,#0f5eb5,#0a4a8a)':sp?'linear-gradient(160deg,#0f4a2a,#1a7a45,#0d5e38)':wi?'linear-gradient(160deg,#1c3550,#2a5478,#1e3a5f)':'linear-gradient(160deg,#1e2e45,#2d4a6a,#1a3050)'
  if(h<20) return su?'linear-gradient(160deg,#1a1a0a,#8b4a0a,#d4820a)':sp?'linear-gradient(160deg,#1a2a0a,#5a7a1a,#c4a020)':wi?'linear-gradient(160deg,#2a1a0a,#6b3a0f,#a05a1a)':'linear-gradient(160deg,#1a1208,#5a3010,#9a5818)'
  return su?'linear-gradient(160deg,#0a0a20,#1a1245,#2d0d30)':wi?'linear-gradient(160deg,#0d0d25,#1a1040,#2a0a3a)':'linear-gradient(160deg,#0d0d22,#18103c,#260c2e)'
}

export default function MainHeader({ trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip, onOpenVoyageurs, onOpenGlobalBudget, isAdmin, onOpenAdmin, onSignOut, userEmail, syncing }) {
  const [time, setTime] = useState({ local: '', dateFR: '', utc: '', dateEN: '' })
  const [bg, setBg] = useState(getBg())
  const [photo, setPhoto] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)
  const refTrips = useRef(null)
  const refAccount = useRef(null)

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      const dFR = ['dim','lun','mar','mer','jeu','ven','sam']
      const mFR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
      const dEN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      const mEN = ['January','February','March','April','May','June','July','August','September','October','November','December']
      const nth = d => d>3&&d<21?'th':['th','st','nd','rd'][d%10]||'th'
      setTime({
        local: n.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
        dateFR: `${dFR[n.getDay()]} ${n.getDate()} ${mFR[n.getMonth()]} ${n.getFullYear()}`,
        utc: n.toUTCString().split(' ')[4],
        dateEN: `${dEN[n.getUTCDay()]} ${n.getUTCDate()}${nth(n.getUTCDate())} ${mEN[n.getUTCMonth()]} ${n.getUTCFullYear()}`
      })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setBg(getBg())
    const id = setInterval(() => setBg(getBg()), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!activeTrip) { setPhoto(null); return }
    const url = getPhoto(activeTrip.name || '', activeTrip.destination || '')
    const img = new window.Image()
    img.onload = () => setPhoto(url)
    img.onerror = () => setPhoto(null)
    img.src = url
  }, [activeTrip?.id])

  useEffect(() => {
    const fn = e => {
      if (!refTrips.current?.contains(e.target) && !refAccount.current?.contains(e.target))
        setOpenMenu(null)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const tog = m => setOpenMenu(p => p === m ? null : m)
  const user = userEmail?.includes('@') ? userEmail.split('@')[0] : userEmail?.slice(0, 12)

  const glassBtn = { background:'rgba(255,255,255,.13)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,.22)', borderRadius:11, padding:'7px 14px', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:500, fontSize:'.82rem', display:'flex', alignItems:'center', gap:'.4rem', whiteSpace:'nowrap' }
  const dd = { position:'absolute', top:'calc(100% + 8px)', zIndex:600, background:'#fff', borderRadius:16, border:'1px solid rgba(0,0,0,.07)', boxShadow:'0 8px 32px rgba(0,0,0,.14)', minWidth:220, overflow:'hidden' }
  const mi = { width:'100%', padding:'.62rem 1rem', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'.83rem', fontWeight:500, color:'var(--text)', display:'flex', alignItems:'center', gap:'.55rem', textAlign:'left' }

  return (
    <div className="main-header-desktop" style={{ position:'relative', overflow:'hidden', background:bg, transition:'background 2s ease', color:'#fff' }}>
      {/* Photo de fond */}
      {photo && <div style={{ position:'absolute', inset:0, backgroundImage:`url(${photo})`, backgroundSize:'cover', backgroundPosition:'center 35%', opacity:.28, transition:'opacity 1.5s' }} />}
      {/* Gradient overlay */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,.2) 0%,rgba(0,0,0,.5) 100%)', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', gap:'1rem', padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,.08)' }}>

        {/* LEFT — Séjours */}
        <div ref={refTrips} style={{ position:'relative' }}>
          <button style={glassBtn} onClick={() => tog('trips')}>
            🥾 Séjours
            <span style={{ fontSize:'.62rem', opacity:.7, background:'rgba(255,255,255,.15)', borderRadius:8, padding:'1px 6px' }}>{trips.length}</span>
            <span style={{ fontSize:'.58rem', opacity:.5 }}>{openMenu==='trips'?'▴':'▾'}</span>
          </button>
          {openMenu === 'trips' && (
            <div style={{ ...dd, left:0 }}>
              <div style={{ padding:'.45rem .9rem', fontSize:'.62rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>Mes séjours</div>
              {trips.map((t, i) => {
                const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
                const active = t.id === activeTrip?.id
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'.5rem', padding:'.52rem .9rem', background:active?'#f5f4f0':'#fff', borderBottom:'1px solid var(--border)', cursor:'pointer' }} onClick={() => { onSelectTrip(t.id); setOpenMenu(null) }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'.83rem', fontWeight:active?600:400, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</div>
                      {t.startDate && <div style={{ fontSize:'.68rem', color:'var(--text-muted)' }}>{new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}</div>}
                    </div>
                    <button onClick={e=>{e.stopPropagation();onEditTrip(t);setOpenMenu(null)}} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'.7rem',color:'var(--text-muted)' }}>✏️</button>
                    {trips.length > 1 && <button onClick={e=>{e.stopPropagation();confirm(`Supprimer "${t.name}" ?`)&&onDeleteTrip(t.id);setOpenMenu(null)}} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'.7rem',color:'var(--text-muted)' }}>🗑</button>}
                  </div>
                )
              })}
              <button style={{ width:'100%', padding:'.58rem .9rem', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'.83rem', fontWeight:600, color:'var(--green)', textAlign:'left' }} onClick={() => { onNewTrip(); setOpenMenu(null) }}>＋ Nouveau séjour</button>
            </div>
          )}
        </div>

        {/* CENTER — Titre + horloge */}
        <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.4rem' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1rem,2.5vw,1.5rem)', fontWeight:700, background:'linear-gradient(135deg,#fff,rgba(255,255,255,.78))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Séjours Vacances
          </div>
          <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', background:'rgba(255,255,255,.08)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,.12)', borderRadius:14, padding:'.4rem 1.2rem', gap:'.05rem' }}>
            <span style={{ fontFamily:'monospace', fontSize:'.75rem', opacity:.82, fontWeight:500 }}>{time.dateFR}</span>
            <div style={{ display:'flex', alignItems:'baseline', gap:'.3rem' }}>
              <span style={{ fontFamily:'monospace', fontSize:'1.5rem', fontWeight:300, letterSpacing:'.04em' }}>{time.local}</span>
              {syncing && <span style={{ opacity:.35, fontSize:'.7rem' }}>☁️</span>}
            </div>
            <span style={{ fontFamily:'monospace', opacity:.38, fontSize:'.62rem', fontWeight:500 }}>UTC {time.utc} · {time.dateEN}</span>
          </div>
        </div>

        {/* RIGHT — Compte */}
        <div ref={refAccount} style={{ position:'relative' }}>
          <button style={{ ...glassBtn, borderRadius:30, padding:'5px 12px 5px 5px' }} onClick={() => tog('account')}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.78rem', fontWeight:700, color:'#fff' }}>
              {user?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize:'.7rem', opacity:.55 }}>{openMenu==='account'?'▴':'▾'}</span>
          </button>
          {openMenu === 'account' && (
            <div style={{ ...dd, right:0 }}>
              <div style={{ padding:'.68rem .9rem', borderBottom:'1px solid var(--border)', background:'#f8f7fc' }}>
                <div style={{ fontSize:'.82rem', fontWeight:600 }}>{user}</div>
                <div style={{ fontSize:'.65rem', color:'var(--text-muted)' }}>Connecté</div>
              </div>
              <button style={mi} onClick={() => { onOpenVoyageurs(); setOpenMenu(null) }}><span>👥</span>Voyageurs</button>
              {onOpenGlobalBudget && <button style={mi} onClick={() => { onOpenGlobalBudget(); setOpenMenu(null) }}><span>💰</span>Budget global</button>}
              {isAdmin && onOpenAdmin && <button style={{ ...mi, color:'#8F4E20' }} onClick={() => { onOpenAdmin(); setOpenMenu(null) }}><span>⚙️</span>Administration</button>}
              {onSignOut && <button style={{ ...mi, color:'var(--red)', borderTop:'1px solid var(--border)' }} onClick={() => { setOpenMenu(null); onSignOut() }}><span>🚪</span>Déconnexion</button>}
            </div>
          )}
        </div>
      </div>

      {/* Onglets séjours */}
      <div style={{ position:'relative', zIndex:1, display:'flex', gap:'.3rem', padding:'.45rem 1.5rem', overflowX:'auto', scrollbarWidth:'none' }}>
        {trips.map((t, i) => {
          const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
          const active = t.id === activeTrip?.id
          return (
            <button key={t.id} onClick={() => onSelectTrip(t.id)} style={{ background:active?color:'rgba(255,255,255,.1)', border:`1.5px solid ${active?color:'rgba(255,255,255,.18)'}`, borderRadius:9, padding:'4px 12px', color:'#fff', cursor:'pointer', fontSize:'.78rem', fontFamily:'inherit', fontWeight:active?600:400, transition:'all .2s', whiteSpace:'nowrap', display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
              <span>{t.name}</span>
              {t.startDate && <span style={{ fontSize:'.58rem', opacity:.68 }}>{new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

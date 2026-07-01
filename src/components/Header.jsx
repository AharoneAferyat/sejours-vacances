import { useState, useEffect, useRef } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

function getHeaderGradient() {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMonth()
  const isSummer = m >= 5 && m <= 8
  const isWinter = m === 11 || m <= 1
  const isSpring = m >= 2 && m <= 4
  if (h < 5) return isWinter ? 'linear-gradient(135deg,#0a0a1a,#0d1b3e,#1a0a2e)' : 'linear-gradient(135deg,#070714,#0d1533,#0a0d1f)'
  if (h < 7) {
    if (isSpring) return 'linear-gradient(135deg,#1a1040,#6b2d6b,#d4722a)'
    if (isSummer) return 'linear-gradient(135deg,#1a1535,#8b3a62,#e8852f)'
    return isWinter ? 'linear-gradient(135deg,#1a1030,#3d1c5e,#7a3b1e)' : 'linear-gradient(135deg,#1a1030,#5c2d6b,#c4622a)'
  }
  if (h < 12) {
    if (isSpring) return 'linear-gradient(135deg,#1a4a2e,#2d7a4f,#4aab72)'
    if (isSummer) return 'linear-gradient(135deg,#1a3a6e,#1e6bb5,#38a0d4)'
    return isWinter ? 'linear-gradient(135deg,#1e3a5f,#2d5986,#4a7fa8)' : 'linear-gradient(135deg,#2a3a50,#3d5a78,#5a7fa0)'
  }
  if (h < 17) {
    if (isSpring) return 'linear-gradient(135deg,#0f4a2a,#1a7a45,#0d5e38)'
    if (isSummer) return 'linear-gradient(135deg,#0a3a7a,#0f5eb5,#0a4a8a)'
    return isWinter ? 'linear-gradient(135deg,#1c3550,#2a5478,#1e3a5f)' : 'linear-gradient(135deg,#1e2e45,#2d4a6a,#1a3050)'
  }
  if (h < 20) {
    if (isSpring) return 'linear-gradient(135deg,#1a2a0a,#5a7a1a,#c4a020)'
    if (isSummer) return 'linear-gradient(135deg,#1a1a0a,#8b4a0a,#d4820a)'
    return isWinter ? 'linear-gradient(135deg,#2a1a0a,#6b3a0f,#a05a1a)' : 'linear-gradient(135deg,#1a1208,#5a3010,#9a5818)'
  }
  if (h < 23) {
    if (isSummer) return 'linear-gradient(135deg,#0a0a20,#1a1245,#2d0d30)'
    return isWinter ? 'linear-gradient(135deg,#0d0d25,#1a1040,#2a0a3a)' : 'linear-gradient(135deg,#0d0d22,#18103c,#260c2e)'
  }
  return 'linear-gradient(135deg,#07071a,#0d1030,#0a0820)'
}

export default function AppHeader({
  trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip,
  voyageurs, onOpenVoyageurs, syncing, onSignOut, userEmail,
  onOpenGlobalBudget, isAdmin, onOpenAdmin
}) {
  const [time, setTime] = useState({ local: '', utc: '', dateFR: '', dateEN: '' })
  const [headerBg, setHeaderBg] = useState(getHeaderGradient())
  const [openMenu, setOpenMenu] = useState(null) // 'trips' | 'account' | null
  const tripsRef = useRef(null)
  const accountRef = useRef(null)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const daysFR = ['dim','lun','mar','mer','jeu','ven','sam']
      const monthsFR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
      const daysEN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      const monthsEN = ['January','February','March','April','May','June','July','August','September','October','November','December']
      const nth = d => { if (d>3&&d<21) return 'th'; switch(d%10){case 1:return 'st';case 2:return 'nd';case 3:return 'rd';default:return 'th'} }
      const u = new Date(now.toISOString())
      setTime({
        local: now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
        utc: u.toUTCString().split(' ')[4],
        dateFR: `${daysFR[now.getDay()]} ${now.getDate()} ${monthsFR[now.getMonth()]} ${now.getFullYear()}`,
        dateEN: `${daysEN[u.getUTCDay()]} ${u.getUTCDate()}${nth(u.getUTCDate())} ${monthsEN[u.getUTCMonth()]} ${u.getUTCFullYear()}`
      })
    }
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id)
  },[])

  useEffect(() => {
    setHeaderBg(getHeaderGradient())
    const id = setInterval(()=>setHeaderBg(getHeaderGradient()),60000)
    return ()=>clearInterval(id)
  },[])

  // Ferme les menus si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (tripsRef.current && !tripsRef.current.contains(e.target)) {
        if (accountRef.current && !accountRef.current.contains(e.target)) {
          setOpenMenu(null)
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  },[])

  const toggle = (menu) => setOpenMenu(prev => prev === menu ? null : menu)

  const displayUser = userEmail?.includes('@') ? userEmail.split('@')[0] : userEmail?.slice(0,12)

  const glassBtn = {
    background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,.18)', borderRadius: 10,
    padding: '6px 12px', color: '#fff', cursor: 'pointer',
    fontFamily: 'inherit', fontWeight: 500, fontSize: 'clamp(.7rem,1.8vw,.82rem)',
    display: 'flex', alignItems: 'center', gap: '.35rem', whiteSpace: 'nowrap'
  }

  const menuBox = {
    position: 'absolute', top: 'calc(100% + 6px)', zIndex: 999,
    background: '#fff', borderRadius: 12, border: '1px solid var(--border)',
    boxShadow: '0 8px 32px rgba(0,0,0,.18)', minWidth: 220, overflow: 'hidden'
  }

  const menuItem = {
    width:'100%', padding:'.65rem .9rem', background:'none', border:'none',
    cursor:'pointer', fontFamily:'inherit', fontSize:'.83rem', fontWeight:500,
    color:'var(--text)', display:'flex', alignItems:'center', gap:'.55rem', textAlign:'left'
  }

  return (
    <header style={{ background: headerBg, transition:'background 2s ease', color:'#fff', position:'relative', overflow:'visible' }}>

      {/* Ambient glow */}
      <div style={{ position:'absolute', top:'-60%', right:'-10%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,.07) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      {/* ROW 1 */}
      <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', gap:'clamp(.4rem,2vw,1rem)', padding:'clamp(.6rem,2vw,1rem) clamp(.75rem,2.5vw,1.25rem)', borderBottom:'1px solid rgba(255,255,255,.08)' }}>

        {/* LEFT — Séjours */}
        <div ref={tripsRef} style={{ position:'relative' }}>
          <button style={glassBtn} onClick={() => toggle('trips')}>
            🥾 Séjours
            <span style={{ fontSize:'.62rem', opacity:.7, background:'rgba(255,255,255,.15)', borderRadius:8, padding:'1px 6px' }}>{trips.length}</span>
            <span style={{ fontSize:'.6rem', opacity:.5 }}>{openMenu==='trips' ? '▴' : '▾'}</span>
          </button>

          {openMenu === 'trips' && (
            <div style={{ ...menuBox, left:0 }}>
              <div style={{ padding:'.45rem .85rem', fontSize:'.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
                Mes séjours
              </div>
              {trips.map((t,i) => {
                const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
                const isActive = t.id === activeTrip?.id
                return (
                  <div key={t.id}
                    style={{ display:'flex', alignItems:'center', padding:'.5rem .85rem', gap:'.5rem', background: isActive ? '#f8f7f3' : '#fff', borderBottom:'1px solid var(--border)', cursor:'pointer' }}
                    onClick={() => { onSelectTrip(t.id); setOpenMenu(null) }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'.83rem', fontWeight: isActive ? 600 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{t.name}</div>
                      {t.startDate && <div style={{ fontSize:'.68rem', color:'var(--text-muted)' }}>
                        {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
                      </div>}
                    </div>
                    <div style={{ display:'flex', gap:3 }}>
                      <button onClick={e=>{e.stopPropagation();onEditTrip(t);setOpenMenu(null)}} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'.72rem',padding:'2px 4px',color:'var(--text-muted)' }}>✏️</button>
                      {trips.length > 1 && <button onClick={e=>{e.stopPropagation();confirm(`Supprimer "${t.name}" ?`)&&onDeleteTrip(t.id);setOpenMenu(null)}} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'.72rem',padding:'2px 4px',color:'var(--text-muted)' }}>🗑</button>}
                    </div>
                  </div>
                )
              })}
              <button style={{ width:'100%', padding:'.6rem .85rem', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'.82rem', fontWeight:600, color:'var(--green)', textAlign:'left' }}
                onClick={() => { onNewTrip(); setOpenMenu(null) }}>
                ＋ Nouveau séjour
              </button>
            </div>
          )}
        </div>

        {/* CENTER — Titre + horloge */}
        <div style={{ textAlign:'center', minWidth:0, display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(.9rem,3vw,1.45rem)', fontWeight:700, marginBottom:'.45rem', background:'linear-gradient(135deg,#fff 0%,rgba(255,255,255,.75) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Séjours Vacances
          </div>
          <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:'.08rem', background:'rgba(255,255,255,.07)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:'clamp(.3rem,1vw,.55rem) clamp(.7rem,2.5vw,1.4rem)' }}>
            <span style={{ fontFamily:'monospace', fontWeight:600, fontSize:'clamp(.7rem,1.6vw,.88rem)', opacity:.9, letterSpacing:'.02em' }}>{time.dateFR}</span>
            <div style={{ display:'flex', alignItems:'baseline', gap:'.35rem' }}>
              <span style={{ fontFamily:'monospace', fontWeight:300, fontSize:'clamp(1rem,3vw,1.55rem)', letterSpacing:'.04em' }}>{time.local}</span>
              {syncing && <span style={{ opacity:.35, fontSize:'.7rem' }}>☁️</span>}
            </div>
            <span style={{ fontFamily:'monospace', opacity:.4, fontSize:'clamp(.58rem,1.3vw,.72rem)', fontWeight:500 }}>UTC {time.utc} · {time.dateEN}</span>
          </div>
        </div>

        {/* RIGHT — Compte */}
        <div ref={accountRef} style={{ position:'relative' }}>
          <button style={{ ...glassBtn, borderRadius:30, padding:'5px 10px 5px 5px' }} onClick={() => toggle('account')}>
            <div style={{ display:'flex' }}>
              {voyageurs.slice(0,2).map((v,i) => (
                <div key={v.id} style={{ width:26,height:26,borderRadius:'50%', background:i===0?'#1D9E75':'#6b7cc4', border:'2px solid rgba(255,255,255,.25)', display:'flex',alignItems:'center',justifyContent:'center', fontSize:'.65rem',fontWeight:700,color:'#fff', marginLeft:i>0?-8:0, zIndex:3-i, position:'relative' }}>
                  {v.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {voyageurs.length > 2 && (
                <div style={{ width:26,height:26,borderRadius:'50%',background:'rgba(255,255,255,.15)',border:'2px solid rgba(255,255,255,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.58rem',color:'#fff',marginLeft:-8 }}>
                  +{voyageurs.length-2}
                </div>
              )}
            </div>
            <span style={{ fontSize:'.7rem', opacity:.55 }}>{openMenu==='account'?'▴':'▾'}</span>
          </button>

          {openMenu === 'account' && (
            <div style={{ ...menuBox, right:0 }}>
              {displayUser && (
                <div style={{ padding:'.7rem .9rem', borderBottom:'1px solid var(--border)', background:'linear-gradient(135deg,#f8f7fc,#f3f0f8)' }}>
                  <div style={{ fontSize:'.8rem', fontWeight:600, color:'var(--text)' }}>{displayUser}</div>
                  <div style={{ fontSize:'.66rem', color:'var(--text-muted)' }}>Connecté</div>
                </div>
              )}
              <button style={menuItem} onClick={() => { onOpenVoyageurs(); setOpenMenu(null) }}>
                <span>👥</span> Voyageurs
              </button>
              {onOpenGlobalBudget && (
                <button style={menuItem} onClick={() => { onOpenGlobalBudget(); setOpenMenu(null) }}>
                  <span>💰</span> Budget global
                </button>
              )}
              {isAdmin && onOpenAdmin && (
                <button style={{ ...menuItem, color:'var(--amber)' }} onClick={() => { onOpenAdmin(); setOpenMenu(null) }}>
                  <span>⚙️</span> Administration
                </button>
              )}
              {onSignOut && (
                <button style={{ ...menuItem, color:'var(--red)', borderTop:'1px solid var(--border)' }} onClick={() => { onSignOut(); setOpenMenu(null) }}>
                  <span>🚪</span> Déconnexion
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ROW 2 — Trip tabs */}
      <div style={{ position:'relative', zIndex:1, display:'flex', gap:'.35rem', padding:'.5rem clamp(.75rem,2.5vw,1.25rem)', overflowX:'auto', scrollbarWidth:'none', alignItems:'center' }}>
        {trips.map((t,i) => {
          const color = t.color || TRIP_COLORS[i%TRIP_COLORS.length]
          const isActive = t.id === activeTrip?.id
          return (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0 }}>
              <button onClick={()=>onSelectTrip(t.id)} style={{ background:isActive?color:'rgba(255,255,255,.08)', border:`1.5px solid ${isActive?color:'rgba(255,255,255,.15)'}`, borderRadius:8, padding:'5px 12px', color:'#fff', cursor:'pointer', fontSize:'clamp(.7rem,1.8vw,.8rem)', fontFamily:'inherit', fontWeight:isActive?600:400, transition:'all .15s', display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
                <span>{t.name}</span>
                {t.startDate && <span style={{ fontSize:'.58rem', opacity:.72 }}>{new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>}
              </button>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <button onClick={()=>onEditTrip(t)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'.65rem',padding:'2px 3px',color:'rgba(255,255,255,.4)',lineHeight:1 }}>✏️</button>
                {trips.length>1 && <button onClick={()=>confirm(`Supprimer "${t.name}" ?`)&&onDeleteTrip(t.id)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'.65rem',padding:'2px 3px',color:'rgba(255,255,255,.3)',lineHeight:1 }}>🗑</button>}
              </div>
            </div>
          )
        })}
      </div>
    </header>
  )
}

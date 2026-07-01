import { useState, useEffect, useRef } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

// ── Thème saison/heure ────────────────────────────────────────────────────────
function getHeaderBg() {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMonth()
  const isSummer = m >= 5 && m <= 8
  const isAutumn = m >= 9 && m <= 10
  const isWinter = m === 11 || m <= 1
  const isSpring = m >= 2 && m <= 4

  if (h < 5) {
    if (isWinter) return 'linear-gradient(135deg,#0a0a1a 0%,#0d1b3e 60%,#1a0a2e 100%)'
    return 'linear-gradient(135deg,#070714 0%,#0d1533 60%,#0a0d1f 100%)'
  }
  if (h < 7) {
    if (isSummer) return 'linear-gradient(135deg,#1a1535 0%,#8b3a62 50%,#e8852f 100%)'
    if (isSpring) return 'linear-gradient(135deg,#1a1040 0%,#6b2d6b 50%,#d4722a 100%)'
    if (isWinter) return 'linear-gradient(135deg,#1a1030 0%,#3d1c5e 50%,#7a3b1e 100%)'
    return 'linear-gradient(135deg,#1a1030 0%,#5c2d6b 50%,#c4622a 100%)'
  }
  if (h < 12) {
    if (isSummer) return 'linear-gradient(135deg,#1a3a6e 0%,#1e6bb5 60%,#38a0d4 100%)'
    if (isSpring) return 'linear-gradient(135deg,#1a4a2e 0%,#2d7a4f 60%,#4aab72 100%)'
    if (isWinter) return 'linear-gradient(135deg,#1e3a5f 0%,#2d5986 60%,#4a7fa8 100%)'
    return 'linear-gradient(135deg,#2a3a50 0%,#3d5a78 60%,#5a7fa0 100%)'
  }
  if (h < 17) {
    if (isSummer) return 'linear-gradient(135deg,#0a3a7a 0%,#0f5eb5 60%,#0a4a8a 100%)'
    if (isSpring) return 'linear-gradient(135deg,#0f4a2a 0%,#1a7a45 60%,#0d5e38 100%)'
    if (isWinter) return 'linear-gradient(135deg,#1c3550 0%,#2a5478 60%,#1e3a5f 100%)'
    return 'linear-gradient(135deg,#1e2e45 0%,#2d4a6a 60%,#1a3050 100%)'
  }
  if (h < 20) {
    if (isSummer) return 'linear-gradient(135deg,#1a1a0a 0%,#8b4a0a 50%,#d4820a 100%)'
    if (isSpring) return 'linear-gradient(135deg,#1a2a0a 0%,#5a7a1a 50%,#c4a020 100%)'
    if (isWinter) return 'linear-gradient(135deg,#2a1a0a 0%,#6b3a0f 50%,#a05a1a 100%)'
    return 'linear-gradient(135deg,#1a1208 0%,#5a3010 50%,#9a5818 100%)'
  }
  if (isSummer) return 'linear-gradient(135deg,#0a0a20 0%,#1a1245 60%,#2d0d30 100%)'
  if (isWinter) return 'linear-gradient(135deg,#0d0d25 0%,#1a1040 60%,#2a0a3a 100%)'
  return 'linear-gradient(135deg,#0d0d22 0%,#18103c 60%,#260c2e 100%)'
}

// ── Photos par type de destination ───────────────────────────────────────────
const PHOTOS = {
  mountain: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85&fit=crop',
  beach:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=85&fit=crop',
  city:     'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=85&fit=crop',
  forest:   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=85&fit=crop',
  lake:     'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1600&q=85&fit=crop',
  default:  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=85&fit=crop',
}

function getPhoto(name = '', dest = '') {
  const t = (name + ' ' + dest).toLowerCase()
  if (/mont|alp|isère|savoie|chamonix|montagne|col|ski|neige|glacier|alti/.test(t)) return PHOTOS.mountain
  if (/mer|plage|côte|méditerranée|atlantique|sea|corse|bretagne/.test(t)) return PHOTOS.beach
  if (/paris|lyon|marseille|bordeaux|ville|city|urban/.test(t)) return PHOTOS.city
  if (/forêt|bois|nature|parc|arbre/.test(t)) return PHOTOS.forest
  if (/lac|rivière|cascade|gorge/.test(t)) return PHOTOS.lake
  return PHOTOS.default
}

// ── Composant ────────────────────────────────────────────────────────────────
export default function AppHeader({
  trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip,
  voyageurs, onOpenVoyageurs, syncing, onSignOut, userEmail,
  onOpenGlobalBudget, isAdmin, onOpenAdmin
}) {
  const [time, setTime] = useState({ local: '', dateFR: '', utc: '', dateEN: '' })
  const [headerBg, setHeaderBg] = useState(getHeaderBg())
  const [bgPhoto, setBgPhoto] = useState(null)
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
      const nth = d => d > 3 && d < 21 ? 'th' : ['th','st','nd','rd'][d%10] || 'th'
      const u = new Date()
      setTime({
        local: now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
        dateFR: `${daysFR[now.getDay()]} ${now.getDate()} ${monthsFR[now.getMonth()]} ${now.getFullYear()}`,
        utc: u.toUTCString().split(' ')[4],
        dateEN: `${daysEN[u.getUTCDay()]} ${u.getUTCDate()}${nth(u.getUTCDate())} ${monthsEN[u.getUTCMonth()]} ${u.getUTCFullYear()}`
      })
    }
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id)
  },[])

  useEffect(()=>{
    setHeaderBg(getHeaderBg())
    const id = setInterval(()=>setHeaderBg(getHeaderBg()),60000)
    return()=>clearInterval(id)
  },[])

  // Charge la photo selon le séjour actif
  useEffect(()=>{
    if(!activeTrip) return
    setBgPhoto(null)
    const url = getPhoto(activeTrip.name||'', activeTrip.destination||'')
    const img = new window.Image()
    img.onload = ()=>setBgPhoto(url)
    img.onerror = ()=>setBgPhoto(null)
    img.src = url
  },[activeTrip?.id])

  // Ferme les menus au clic dehors
  useEffect(()=>{
    const handler = e => {
      if(tripsRef.current?.contains(e.target)) return
      if(accountRef.current?.contains(e.target)) return
      setOpenMenu(null)
    }
    document.addEventListener('mousedown',handler)
    return()=>document.removeEventListener('mousedown',handler)
  },[])

  const toggle = menu => setOpenMenu(p => p===menu ? null : menu)
  const displayUser = userEmail?.includes('@') ? userEmail.split('@')[0] : userEmail?.slice(0,12)

  const glassBtn = {
    background:'rgba(255,255,255,.12)', backdropFilter:'blur(16px)',
    border:'1px solid rgba(255,255,255,.2)', borderRadius:12,
    padding:'7px 14px', color:'#fff', cursor:'pointer',
    fontFamily:'inherit', fontWeight:500, fontSize:'clamp(.72rem,1.8vw,.84rem)',
    display:'flex', alignItems:'center', gap:'.4rem', whiteSpace:'nowrap',
    transition:'background .15s',
  }

  const dropdown = {
    position:'absolute', top:'calc(100% + 8px)', zIndex:500,
    background:'#fff', borderRadius:16, border:'1px solid rgba(0,0,0,.06)',
    boxShadow:'0 8px 40px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08)',
    minWidth:220, overflow:'hidden',
  }

  const menuItem = {
    width:'100%', padding:'.65rem 1rem', background:'none', border:'none',
    cursor:'pointer', fontFamily:'inherit', fontSize:'.84rem', fontWeight:500,
    color:'var(--text)', display:'flex', alignItems:'center', gap:'.6rem', textAlign:'left',
    transition:'background .1s',
  }

  return (
    <header style={{
      position:'relative', overflow:'hidden', color:'#fff',
      background: headerBg, transition:'background 2s ease',
    }}>
      {/* Photo de fond */}
      {bgPhoto && (
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${bgPhoto})`,
          backgroundSize:'cover', backgroundPosition:'center 40%',
          opacity:.28, transition:'opacity 1.5s ease',
        }}/>
      )}
      {/* Gradient overlay pour lisibilité */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.35) 100%)',
        pointerEvents:'none',
      }}/>
      {/* Glow ambiant */}
      <div style={{
        position:'absolute', top:'-40%', right:'-5%', width:400, height:400,
        borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,.06) 0%,transparent 70%)',
        pointerEvents:'none',
      }}/>

      {/* ── ROW 1 : Séjours | Titre + Horloge | Compte ── */}
      <div style={{
        position:'relative', zIndex:1,
        display:'grid', gridTemplateColumns:'auto 1fr auto',
        alignItems:'center', gap:'clamp(.5rem,2vw,1.25rem)',
        padding:'clamp(.75rem,2vw,1.1rem) clamp(.75rem,3vw,1.5rem)',
        borderBottom:'1px solid rgba(255,255,255,.08)',
      }}>

        {/* LEFT — Séjours dropdown */}
        <div ref={tripsRef} style={{position:'relative'}}>
          <button style={glassBtn} onClick={()=>toggle('trips')}>
            🥾 <span style={{maxWidth:'clamp(60px,12vw,140px)', overflow:'hidden', textOverflow:'ellipsis'}}>Séjours</span>
            <span style={{fontSize:'.62rem',opacity:.7,background:'rgba(255,255,255,.15)',borderRadius:8,padding:'1px 6px'}}>{trips.length}</span>
            <span style={{fontSize:'.58rem',opacity:.5}}>{openMenu==='trips'?'▴':'▾'}</span>
          </button>

          {openMenu==='trips' && (
            <div style={{...dropdown, left:0, maxWidth:'min(280px,90vw)'}}>
              <div style={{padding:'.5rem 1rem',fontSize:'.65rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)',borderBottom:'1px solid var(--border)'}}>
                Mes séjours
              </div>
              {trips.map((t,i)=>{
                const color = t.color||TRIP_COLORS[i%TRIP_COLORS.length]
                const isActive = t.id===activeTrip?.id
                return (
                  <div key={t.id}
                    style={{display:'flex',alignItems:'center',padding:'.55rem 1rem',gap:'.5rem',background:isActive?'#f5f4f0':'#fff',borderBottom:'1px solid var(--border)',cursor:'pointer'}}
                    onClick={()=>{onSelectTrip(t.id);setOpenMenu(null)}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'.84rem',fontWeight:isActive?600:400,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</div>
                      {t.startDate&&<div style={{fontSize:'.68rem',color:'var(--text-muted)'}}>
                        {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
                      </div>}
                    </div>
                    <div style={{display:'flex',gap:3,flexShrink:0}}>
                      <button onClick={e=>{e.stopPropagation();onEditTrip(t);setOpenMenu(null)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'.7rem',padding:'2px 4px',color:'var(--text-muted)'}}>✏️</button>
                      {trips.length>1&&<button onClick={e=>{e.stopPropagation();confirm(`Supprimer "${t.name}" ?`)&&onDeleteTrip(t.id);setOpenMenu(null)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'.7rem',padding:'2px 4px',color:'var(--text-muted)'}}>🗑</button>}
                    </div>
                  </div>
                )
              })}
              <button style={{width:'100%',padding:'.6rem 1rem',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.84rem',fontWeight:600,color:'var(--green)',textAlign:'left'}}
                onClick={()=>{onNewTrip();setOpenMenu(null)}}>
                ＋ Nouveau séjour
              </button>
            </div>
          )}
        </div>

        {/* CENTER — Titre + Horloge */}
        <div style={{textAlign:'center',minWidth:0,display:'flex',flexDirection:'column',alignItems:'center',gap:'.4rem'}}>
          <div style={{
            fontFamily:"'Playfair Display',serif",
            fontSize:'clamp(1rem,3.5vw,1.6rem)', fontWeight:700,
            background:'linear-gradient(135deg,#fff 0%,rgba(255,255,255,.82) 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            lineHeight:1.1,
          }}>
            Séjours Vacances
          </div>
          <div style={{
            display:'inline-flex', flexDirection:'column', alignItems:'center',
            background:'rgba(255,255,255,.08)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,.12)', borderRadius:14,
            padding:'clamp(.35rem,1vw,.55rem) clamp(.75rem,3vw,1.4rem)',
            gap:'.05rem',
          }}>
            <span style={{fontFamily:'monospace',fontSize:'clamp(.68rem,1.6vw,.84rem)',fontWeight:500,opacity:.85,letterSpacing:'.02em'}}>{time.dateFR}</span>
            <div style={{display:'flex',alignItems:'baseline',gap:'.3rem'}}>
              <span style={{fontFamily:'monospace',fontSize:'clamp(1.1rem,3.2vw,1.65rem)',fontWeight:300,letterSpacing:'.04em'}}>{time.local}</span>
              {syncing&&<span style={{opacity:.35,fontSize:'.7rem'}}>☁️</span>}
            </div>
            <span style={{fontFamily:'monospace',opacity:.38,fontSize:'clamp(.58rem,1.2vw,.7rem)',fontWeight:500}}>UTC {time.utc} · {time.dateEN}</span>
          </div>
        </div>

        {/* RIGHT — Compte */}
        <div ref={accountRef} style={{position:'relative'}}>
          <button style={{...glassBtn,borderRadius:30,padding:'5px 12px 5px 5px'}} onClick={()=>toggle('account')}>
            <div style={{display:'flex'}}>
              {voyageurs.slice(0,2).map((v,i)=>(
                <div key={v.id} style={{
                  width:26,height:26,borderRadius:'50%',
                  background:i===0?'#1D9E75':'#6b7cc4',
                  border:'2px solid rgba(255,255,255,.22)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'.65rem',fontWeight:700,color:'#fff',
                  marginLeft:i>0?-8:0,zIndex:3-i,position:'relative',
                }}>
                  {v.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {voyageurs.length>2&&(
                <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(255,255,255,.15)',border:'2px solid rgba(255,255,255,.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.58rem',color:'#fff',marginLeft:-8}}>
                  +{voyageurs.length-2}
                </div>
              )}
            </div>
            <span style={{fontSize:'.68rem',opacity:.55}}>{openMenu==='account'?'▴':'▾'}</span>
          </button>

          {openMenu==='account'&&(
            <div style={{...dropdown,right:0}}>
              {displayUser&&(
                <div style={{padding:'.7rem 1rem',borderBottom:'1px solid var(--border)',background:'linear-gradient(135deg,#f8f7fc,#f3f0f8)'}}>
                  <div style={{fontSize:'.82rem',fontWeight:600,color:'var(--text)'}}>{displayUser}</div>
                  <div style={{fontSize:'.66rem',color:'var(--text-muted)'}}>Connecté</div>
                </div>
              )}
              <button style={menuItem} onClick={()=>{onOpenVoyageurs();setOpenMenu(null)}}>
                <span>👥</span> Voyageurs
              </button>
              {onOpenGlobalBudget&&(
                <button style={menuItem} onClick={()=>{onOpenGlobalBudget();setOpenMenu(null)}}>
                  <span>💰</span> Budget global
                </button>
              )}
              {isAdmin&&onOpenAdmin&&(
                <button style={{...menuItem,color:'#8F4E20'}} onClick={()=>{onOpenAdmin();setOpenMenu(null)}}>
                  <span>⚙️</span> Administration
                </button>
              )}
              {onSignOut&&(
                <button style={{...menuItem,color:'var(--red)',borderTop:'1px solid var(--border)'}} onClick={()=>{onSignOut();setOpenMenu(null)}}>
                  <span>🚪</span> Déconnexion
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2 : Onglets séjours ── */}
      <div style={{
        position:'relative', zIndex:1,
        display:'flex', gap:'.3rem', alignItems:'center',
        padding:'.45rem clamp(.75rem,3vw,1.5rem)',
        overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch',
      }}>
        {trips.map((t,i)=>{
          const color = t.color||TRIP_COLORS[i%TRIP_COLORS.length]
          const isActive = t.id===activeTrip?.id
          return (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:2,flexShrink:0}}>
              <button onClick={()=>onSelectTrip(t.id)} style={{
                background:isActive?color:'rgba(255,255,255,.1)',
                border:`1.5px solid ${isActive?color:'rgba(255,255,255,.18)'}`,
                borderRadius:10, padding:'5px 12px', color:'#fff', cursor:'pointer',
                fontSize:'clamp(.7rem,1.8vw,.8rem)', fontFamily:'inherit',
                fontWeight:isActive?600:400, transition:'all .2s',
                display:'flex', flexDirection:'column', alignItems:'flex-start',
              }}>
                <span>{t.name}</span>
                {t.startDate&&<span style={{fontSize:'.58rem',opacity:.7}}>
                  {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                </span>}
              </button>
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <button onClick={()=>onEditTrip(t)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'.65rem',padding:'2px 3px',color:'rgba(255,255,255,.4)',lineHeight:1}}>✏️</button>
                {trips.length>1&&<button onClick={()=>confirm(`Supprimer "${t.name}" ?`)&&onDeleteTrip(t.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'.65rem',padding:'2px 3px',color:'rgba(255,255,255,.32)',lineHeight:1}}>🗑</button>}
              </div>
            </div>
          )
        })}
      </div>
    </header>
  )
}

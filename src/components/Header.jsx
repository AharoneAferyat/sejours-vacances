import { useState, useEffect, useRef } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

function getHeaderBg() {
  const h = new Date().getHours(), m = new Date().getMonth()
  const isSummer=m>=5&&m<=8,isWinter=m===11||m<=1,isSpring=m>=2&&m<=4
  if(h<5) return isWinter?'linear-gradient(135deg,#0a0a1a,#0d1b3e,#1a0a2e)':'linear-gradient(135deg,#070714,#0d1533,#0a0d1f)'
  if(h<7) { if(isSummer)return'linear-gradient(135deg,#1a1535,#8b3a62,#e8852f)'; if(isSpring)return'linear-gradient(135deg,#1a1040,#6b2d6b,#d4722a)'; return isWinter?'linear-gradient(135deg,#1a1030,#3d1c5e,#7a3b1e)':'linear-gradient(135deg,#1a1030,#5c2d6b,#c4622a)' }
  if(h<12) { if(isSummer)return'linear-gradient(135deg,#1a3a6e,#1e6bb5,#38a0d4)'; if(isSpring)return'linear-gradient(135deg,#1a4a2e,#2d7a4f,#4aab72)'; return isWinter?'linear-gradient(135deg,#1e3a5f,#2d5986,#4a7fa8)':'linear-gradient(135deg,#2a3a50,#3d5a78,#5a7fa0)' }
  if(h<17) { if(isSummer)return'linear-gradient(135deg,#0a3a7a,#0f5eb5,#0a4a8a)'; if(isSpring)return'linear-gradient(135deg,#0f4a2a,#1a7a45,#0d5e38)'; return isWinter?'linear-gradient(135deg,#1c3550,#2a5478,#1e3a5f)':'linear-gradient(135deg,#1e2e45,#2d4a6a,#1a3050)' }
  if(h<20) { if(isSummer)return'linear-gradient(135deg,#1a1a0a,#8b4a0a,#d4820a)'; if(isSpring)return'linear-gradient(135deg,#1a2a0a,#5a7a1a,#c4a020)'; return isWinter?'linear-gradient(135deg,#2a1a0a,#6b3a0f,#a05a1a)':'linear-gradient(135deg,#1a1208,#5a3010,#9a5818)' }
  if(isSummer)return'linear-gradient(135deg,#0a0a20,#1a1245,#2d0d30)'; if(isWinter)return'linear-gradient(135deg,#0d0d25,#1a1040,#2a0a3a)'; return'linear-gradient(135deg,#0d0d22,#18103c,#260c2e)'
}

const PHOTOS = {
  mountain:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&fit=crop',
  beach:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80&fit=crop',
  city:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80&fit=crop',
  forest:'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80&fit=crop',
  lake:'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1600&q=80&fit=crop',
  default:'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80&fit=crop',
}
function getPhoto(name='',dest='') {
  const t=(name+' '+dest).toLowerCase()
  if(/mont|alp|isère|savoie|chamonix|montagne|col|ski|neige|glacier/.test(t))return PHOTOS.mountain
  if(/mer|plage|côte|méditerranée|sea|corse|bretagne/.test(t))return PHOTOS.beach
  if(/paris|lyon|marseille|bordeaux|ville|city/.test(t))return PHOTOS.city
  if(/forêt|bois|parc|arbre/.test(t))return PHOTOS.forest
  if(/lac|rivière|cascade|gorge/.test(t))return PHOTOS.lake
  return PHOTOS.default
}

export default function AppHeader({
  trips,activeTrip,onSelectTrip,onNewTrip,onEditTrip,onDeleteTrip,
  voyageurs,onOpenVoyageurs,syncing,onSignOut,userEmail,
  onOpenGlobalBudget,isAdmin,onOpenAdmin
}) {
  const [time,setTime]=useState({local:'',dateFR:'',utc:'',dateEN:''})
  const [headerBg,setHeaderBg]=useState(getHeaderBg())
  const [bgPhoto,setBgPhoto]=useState(null)
  const [openMenu,setOpenMenu]=useState(null)
  const tripsRef=useRef(null),accountRef=useRef(null)

  useEffect(()=>{
    const tick=()=>{
      const now=new Date()
      const dFR=['dim','lun','mar','mer','jeu','ven','sam']
      const mFR=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
      const dEN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      const mEN=['January','February','March','April','May','June','July','August','September','October','November','December']
      const nth=d=>d>3&&d<21?'th':['th','st','nd','rd'][d%10]||'th'
      const u=new Date()
      setTime({
        local:now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
        dateFR:`${dFR[now.getDay()]} ${now.getDate()} ${mFR[now.getMonth()]} ${now.getFullYear()}`,
        utc:u.toUTCString().split(' ')[4],
        dateEN:`${dEN[u.getUTCDay()]} ${u.getUTCDate()}${nth(u.getUTCDate())} ${mEN[u.getUTCMonth()]} ${u.getUTCFullYear()}`
      })
    }
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id)
  },[])

  useEffect(()=>{
    setHeaderBg(getHeaderBg())
    const id=setInterval(()=>setHeaderBg(getHeaderBg()),60000)
    return()=>clearInterval(id)
  },[])

  useEffect(()=>{
    if(!activeTrip){setBgPhoto(null);return}
    const url=getPhoto(activeTrip.name||'',activeTrip.destination||'')
    const img=new window.Image()
    img.onload=()=>setBgPhoto(url)
    img.onerror=()=>setBgPhoto(null)
    img.src=url
    // Ferme les menus au changement de séjour
    setOpenMenu(null)
  },[activeTrip?.id])

  // Ferme menus au clic dehors
  useEffect(()=>{
    const h=e=>{
      if(tripsRef.current?.contains(e.target))return
      if(accountRef.current?.contains(e.target))return
      setOpenMenu(null)
    }
    document.addEventListener('mousedown',h)
    return()=>document.removeEventListener('mousedown',h)
  },[])

  const toggle=menu=>setOpenMenu(p=>p===menu?null:menu)
  const displayUser=userEmail?.includes('@')?userEmail.split('@')[0]:userEmail?.slice(0,12)

  const gBtn={
    background:'rgba(255,255,255,.12)',backdropFilter:'blur(16px)',
    border:'1px solid rgba(255,255,255,.2)',borderRadius:12,
    padding:'7px 14px',color:'#fff',cursor:'pointer',
    fontFamily:'inherit',fontWeight:500,fontSize:'clamp(.72rem,1.8vw,.84rem)',
    display:'flex',alignItems:'center',gap:'.4rem',whiteSpace:'nowrap',
  }
  const ddBox={
    position:'absolute',top:'calc(100% + 8px)',zIndex:500,
    background:'#fff',borderRadius:16,border:'1px solid rgba(0,0,0,.06)',
    boxShadow:'0 8px 40px rgba(0,0,0,.14),0 2px 8px rgba(0,0,0,.07)',
    minWidth:220,overflow:'hidden',
  }
  const mItem={
    width:'100%',padding:'.65rem 1rem',background:'none',border:'none',
    cursor:'pointer',fontFamily:'inherit',fontSize:'.84rem',fontWeight:500,
    color:'var(--text)',display:'flex',alignItems:'center',gap:'.6rem',textAlign:'left',
  }

  // ── SIDEBAR (desktop uniquement via CSS) ──────────────────────────────────
  const Sidebar=()=>(
    <aside className="app-sidebar" style={{background:headerBg,transition:'background 2s ease'}}>
      {bgPhoto&&<div style={{position:'absolute',inset:0,backgroundImage:`url(${bgPhoto})`,backgroundSize:'cover',backgroundPosition:'center',opacity:.25,transition:'opacity 1.5s'}}/>}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.2) 0%,rgba(0,0,0,.6) 100%)',pointerEvents:'none'}}/>
      <div className="app-sidebar-inner">
        {/* Logo */}
        <div className="sb-logo">
          <span style={{fontSize:'1.3rem'}}>🥾</span>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'.95rem',fontWeight:700,color:'#fff',lineHeight:1.2}}>Séjours<br/>Vacances</div>
        </div>

        {/* Horloge */}
        <div className="sb-clock">
          <div style={{fontSize:'.68rem',opacity:.65,marginBottom:'.15rem'}}>{time.dateFR}</div>
          <div style={{fontFamily:'monospace',fontSize:'1.55rem',fontWeight:300,letterSpacing:'.04em',lineHeight:1}}>{time.local}</div>
          <div style={{fontFamily:'monospace',fontSize:'.58rem',opacity:.38,marginTop:'.2rem'}}>UTC {time.utc}</div>
        </div>

        {/* Séjours */}
        <div style={{marginBottom:'.5rem'}}>
          <div className="sb-section-label">Séjours</div>
          {trips.map((t,i)=>{
            const color=t.color||TRIP_COLORS[i%TRIP_COLORS.length]
            const isActive=t.id===activeTrip?.id
            return(
              <div key={t.id} className={`sb-trip${isActive?' active':''}`} onClick={()=>onSelectTrip(t.id)}>
                <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'.82rem',fontWeight:isActive?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</div>
                  {t.startDate&&<div style={{fontSize:'.65rem',opacity:.55}}>
                    {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                  </div>}
                </div>
                <div className="sb-trip-actions">
                  <button onClick={e=>{e.stopPropagation();onEditTrip(t)}} className="sb-trip-btn">✏️</button>
                  {trips.length>1&&<button onClick={e=>{e.stopPropagation();confirm(`Supprimer "${t.name}" ?`)&&onDeleteTrip(t.id)}} className="sb-trip-btn">🗑</button>}
                </div>
              </div>
            )
          })}
          <button className="sb-new-trip" onClick={onNewTrip}>＋ Nouveau séjour</button>
        </div>

        {/* Nav */}
        <div className="sb-nav">
          <button className="sb-nav-item" onClick={onOpenVoyageurs}><span>👥</span>Voyageurs</button>
          {onOpenGlobalBudget&&<button className="sb-nav-item" onClick={onOpenGlobalBudget}><span>💰</span>Budget global</button>}
          {isAdmin&&onOpenAdmin&&<button className="sb-nav-item sb-nav-admin" onClick={onOpenAdmin}><span>⚙️</span>Administration</button>}
          <button className="sb-nav-item sb-nav-danger" onClick={()=>{setOpenMenu(null);onSignOut()}}><span>→</span>Déconnexion</button>
        </div>

        {/* User */}
        <div className="sb-user">
          <div className="sb-avatar">{displayUser?.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{fontSize:'.78rem',fontWeight:600,color:'#fff'}}>{displayUser}</div>
            <div style={{fontSize:'.62rem',opacity:.45,color:'#fff'}}>Connecté{syncing?' · ☁️':''}</div>
          </div>
        </div>
      </div>
    </aside>
  )

  // ── TOP BAR MOBILE ────────────────────────────────────────────────────────
  const MobileTopBar=()=>(
    <div className="mobile-topbar" style={{background:headerBg,transition:'background 2s ease',position:'relative',overflow:'hidden'}}>
      {bgPhoto&&<div style={{position:'absolute',inset:0,backgroundImage:`url(${bgPhoto})`,backgroundSize:'cover',backgroundPosition:'center',opacity:.22}}/>}
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.3)',pointerEvents:'none'}}/>
      <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.7rem 1rem'}}>
        <div ref={tripsRef} style={{position:'relative'}}>
          <button style={{...gBtn,borderRadius:10,padding:'5px 10px',fontSize:'.78rem'}} onClick={()=>toggle('trips')}>
            🥾 {activeTrip?.name||'Séjours'}
            <span style={{fontSize:'.58rem',opacity:.55}}>{openMenu==='trips'?'▴':'▾'}</span>
          </button>
          {openMenu==='trips'&&(
            <div style={{...ddBox,left:0,top:'calc(100% + 6px)',maxWidth:'calc(100vw - 20px)'}}>
              <div style={{padding:'.4rem .85rem',fontSize:'.63rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)',borderBottom:'1px solid var(--border)'}}>Mes séjours</div>
              {trips.map((t,i)=>{
                const color=t.color||TRIP_COLORS[i%TRIP_COLORS.length]
                const isActive=t.id===activeTrip?.id
                return(
                  <div key={t.id} style={{display:'flex',alignItems:'center',gap:'.45rem',padding:'.5rem .85rem',background:isActive?'#f5f4f0':'#fff',borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>{onSelectTrip(t.id);setOpenMenu(null)}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                    <span style={{fontSize:'.83rem',fontWeight:isActive?600:400,color:'var(--text)'}}>{t.name}</span>
                  </div>
                )
              })}
              <button style={{width:'100%',padding:'.55rem .85rem',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.83rem',fontWeight:600,color:'var(--green)',textAlign:'left'}} onClick={()=>{onNewTrip();setOpenMenu(null)}}>＋ Nouveau séjour</button>
            </div>
          )}
        </div>
        <div style={{fontFamily:'monospace',color:'#fff',fontSize:'.88rem',fontWeight:500}}>{time.local}</div>
        <div ref={accountRef} style={{position:'relative'}}>
          <button style={{...gBtn,borderRadius:'50%',width:32,height:32,padding:0,justifyContent:'center'}} onClick={()=>toggle('account')}>
            {displayUser?.charAt(0).toUpperCase()}
          </button>
          {openMenu==='account'&&(
            <div style={{...ddBox,right:0,top:'calc(100% + 6px)'}}>
              <div style={{padding:'.65rem .9rem',borderBottom:'1px solid var(--border)',background:'#f8f7fc'}}>
                <div style={{fontSize:'.82rem',fontWeight:600}}>{displayUser}</div>
                <div style={{fontSize:'.66rem',color:'var(--text-muted)'}}>Connecté</div>
              </div>
              <button style={mItem} onClick={()=>{onOpenVoyageurs();setOpenMenu(null)}}><span>👥</span>Voyageurs</button>
              {onOpenGlobalBudget&&<button style={mItem} onClick={()=>{onOpenGlobalBudget();setOpenMenu(null)}}><span>💰</span>Budget global</button>}
              {isAdmin&&onOpenAdmin&&<button style={{...mItem,color:'#8F4E20'}} onClick={()=>{onOpenAdmin();setOpenMenu(null)}}><span>⚙️</span>Administration</button>}
              {onSignOut&&<button style={{...mItem,color:'var(--red)',borderTop:'1px solid var(--border)'}} onClick={()=>{setOpenMenu(null);onSignOut()}}><span>🚪</span>Déconnexion</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return(
    <>
      <Sidebar/>
      <MobileTopBar/>
    </>
  )
}

import { useState, useEffect, useRef } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

function getBg() {
  const h = new Date().getHours(), m = new Date().getMonth()
  const su=m>=5&&m<=8,wi=m===11||m<=1,sp=m>=2&&m<=4
  if(h<5)  return wi?'linear-gradient(160deg,#0a0a1a,#0d1b3e,#1a0a2e)':'linear-gradient(160deg,#070714,#0d1533,#0a0d1f)'
  if(h<7)  return su?'linear-gradient(160deg,#1a1535,#8b3a62,#e8852f)':sp?'linear-gradient(160deg,#1a1040,#6b2d6b,#d4722a)':wi?'linear-gradient(160deg,#1a1030,#3d1c5e,#7a3b1e)':'linear-gradient(160deg,#1a1030,#5c2d6b,#c4622a)'
  if(h<12) return su?'linear-gradient(160deg,#1a3a6e,#1e6bb5,#38a0d4)':sp?'linear-gradient(160deg,#1a4a2e,#2d7a4f,#4aab72)':wi?'linear-gradient(160deg,#1e3a5f,#2d5986,#4a7fa8)':'linear-gradient(160deg,#2a3a50,#3d5a78,#5a7fa0)'
  if(h<17) return su?'linear-gradient(160deg,#0a3a7a,#0f5eb5,#0a4a8a)':sp?'linear-gradient(160deg,#0f4a2a,#1a7a45,#0d5e38)':wi?'linear-gradient(160deg,#1c3550,#2a5478,#1e3a5f)':'linear-gradient(160deg,#1e2e45,#2d4a6a,#1a3050)'
  if(h<20) return su?'linear-gradient(160deg,#1a1a0a,#8b4a0a,#d4820a)':sp?'linear-gradient(160deg,#1a2a0a,#5a7a1a,#c4a020)':wi?'linear-gradient(160deg,#2a1a0a,#6b3a0f,#a05a1a)':'linear-gradient(160deg,#1a1208,#5a3010,#9a5818)'
  return su?'linear-gradient(160deg,#0a0a20,#1a1245,#2d0d30)':wi?'linear-gradient(160deg,#0d0d25,#1a1040,#2a0a3a)':'linear-gradient(160deg,#0d0d22,#18103c,#260c2e)'
}

const PHOTOS = {
  mountain: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&fit=crop',
  beach:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80&fit=crop',
  city:     'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80&fit=crop',
  forest:   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80&fit=crop',
  lake:     'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1600&q=80&fit=crop',
  default:  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80&fit=crop',
}
function getPhoto(name='',dest=''){
  const t=(name+' '+dest).toLowerCase()
  if(/mont|alp|isère|savoie|chamonix|montagne|ski|neige|glacier/.test(t)) return PHOTOS.mountain
  if(/mer|plage|côte|méditerranée|sea|corse|bretagne/.test(t)) return PHOTOS.beach
  if(/paris|lyon|marseille|bordeaux|ville|city/.test(t)) return PHOTOS.city
  if(/forêt|bois|parc|arbre/.test(t)) return PHOTOS.forest
  if(/lac|rivière|cascade|gorge/.test(t)) return PHOTOS.lake
  return PHOTOS.default
}

export default function AppHeader({
  trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip,
  voyageurs, onOpenVoyageurs, syncing, onSignOut, userEmail,
  onOpenGlobalBudget, isAdmin, onOpenAdmin
}) {
  const [time, setTime] = useState({local:'',dateFR:'',utc:'',dateEN:''})
  const [bg, setBg] = useState(getBg())
  const [photo, setPhoto] = useState(null)
  const [menu, setMenu] = useState(null) // null | 'trips' | 'account'
  const refTrips = useRef(null)
  const refAccount = useRef(null)

  useEffect(()=>{
    const tick=()=>{
      const n=new Date()
      const dFR=['dim','lun','mar','mer','jeu','ven','sam']
      const mFR=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
      const dEN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      const mEN=['January','February','March','April','May','June','July','August','September','October','November','December']
      const nth=d=>d>3&&d<21?'th':['th','st','nd','rd'][d%10]||'th'
      setTime({
        local:n.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
        dateFR:`${dFR[n.getDay()]} ${n.getDate()} ${mFR[n.getMonth()]} ${n.getFullYear()}`,
        utc:n.toUTCString().split(' ')[4],
        dateEN:`${dEN[n.getUTCDay()]} ${n.getUTCDate()}${nth(n.getUTCDate())} ${mEN[n.getUTCMonth()]} ${n.getUTCFullYear()}`
      })
    }
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[])

  useEffect(()=>{
    setBg(getBg())
    const id=setInterval(()=>setBg(getBg()),60000)
    return()=>clearInterval(id)
  },[])

  useEffect(()=>{
    setMenu(null)
    if(!activeTrip){setPhoto(null);return}
    const url=getPhoto(activeTrip.name||'',activeTrip.destination||'')
    const img=new window.Image()
    img.onload=()=>setPhoto(url)
    img.onerror=()=>setPhoto(null)
    img.src=url
  },[activeTrip?.id])

  // Ferme menus au clic dehors
  useEffect(()=>{
    const fn=e=>{
      if(!refTrips.current?.contains(e.target)&&!refAccount.current?.contains(e.target)) setMenu(null)
    }
    document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[])

  const tog=m=>setMenu(p=>p===m?null:m)
  const user=userEmail?.includes('@')?userEmail.split('@')[0]:userEmail?.slice(0,12)

  const glassBtn={
    background:'rgba(255,255,255,.13)',backdropFilter:'blur(12px)',
    border:'1px solid rgba(255,255,255,.22)',borderRadius:11,
    padding:'6px 13px',color:'#fff',cursor:'pointer',
    fontFamily:'inherit',fontWeight:500,fontSize:'clamp(.72rem,1.7vw,.83rem)',
    display:'flex',alignItems:'center',gap:'.35rem',whiteSpace:'nowrap',
  }
  const dd={
    position:'absolute',top:'calc(100% + 7px)',zIndex:600,
    background:'#fff',borderRadius:16,border:'1px solid rgba(0,0,0,.07)',
    boxShadow:'0 8px 32px rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.06)',
    minWidth:210,overflow:'hidden',
  }
  const mi={width:'100%',padding:'.6rem .95rem',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.83rem',fontWeight:500,color:'var(--text)',display:'flex',alignItems:'center',gap:'.55rem',textAlign:'left'}

  // ─── SIDEBAR (desktop uniquement) ────────────────────────────────────────
  const Sidebar = () => (
    <aside style={{
      position:'fixed',top:0,left:0,bottom:0,width:220,
      background:bg,transition:'background 2s ease',
      zIndex:100,flexDirection:'column',
      overflow:'hidden',
    }} className="app-sidebar">
      {/* Photo de fond dans la sidebar */}
      {photo&&<div style={{position:'absolute',inset:0,backgroundImage:`url(${photo})`,backgroundSize:'cover',backgroundPosition:'center',opacity:.22,transition:'opacity 1.5s'}}/>}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,.65) 100%)',pointerEvents:'none'}}/>

      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',height:'100%',padding:'1.25rem .9rem',gap:0}}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:'.55rem',marginBottom:'1.2rem',padding:'0 .3rem'}}>
          <span style={{fontSize:'1.25rem'}}>🥾</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:'.92rem',fontWeight:700,color:'#fff',lineHeight:1.15}}>Séjours<br/>Vacances</span>
        </div>

        {/* Horloge */}
        <div style={{background:'rgba(255,255,255,.09)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.13)',borderRadius:12,padding:'.75rem .85rem',marginBottom:'.9rem',color:'#fff'}}>
          <div style={{fontSize:'.63rem',opacity:.6,marginBottom:'.1rem'}}>{time.dateFR}</div>
          <div style={{fontFamily:'monospace',fontSize:'1.45rem',fontWeight:300,letterSpacing:'.04em',lineHeight:1}}>{time.local}</div>
          <div style={{fontFamily:'monospace',fontSize:'.57rem',opacity:.35,marginTop:'.15rem'}}>UTC {time.utc}</div>
        </div>

        {/* Séjours */}
        <div style={{marginBottom:'.6rem'}}>
          <div style={{fontSize:'.58rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.09em',color:'rgba(255,255,255,.38)',padding:'0 .4rem',marginBottom:'.3rem'}}>Séjours</div>
          {trips.map((t,i)=>{
            const color=t.color||TRIP_COLORS[i%TRIP_COLORS.length]
            const active=t.id===activeTrip?.id
            return(
              <div key={t.id} onClick={()=>onSelectTrip(t.id)}
                style={{display:'flex',alignItems:'center',gap:'.4rem',padding:'.45rem .5rem',borderRadius:9,cursor:'pointer',background:active?'rgba(255,255,255,.18)':'transparent',color:active?'#fff':'rgba(255,255,255,.75)',marginBottom:'.08rem',transition:'background .15s'}}
                onMouseEnter={e=>!active&&(e.currentTarget.style.background='rgba(255,255,255,.1)')}
                onMouseLeave={e=>!active&&(e.currentTarget.style.background='transparent')}>
                <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'.8rem',fontWeight:active?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</div>
                  {t.startDate&&<div style={{fontSize:'.62rem',opacity:.52}}>
                    {new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                  </div>}
                </div>
                <button onClick={e=>{e.stopPropagation();onEditTrip(t)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'.62rem',padding:'1px 3px',color:'rgba(255,255,255,.4)',opacity:0}} className="sb-edit-btn">✏️</button>
              </div>
            )
          })}
          <button onClick={onNewTrip} style={{width:'100%',background:'rgba(255,255,255,.08)',border:'1px dashed rgba(255,255,255,.18)',borderRadius:9,padding:'.4rem',color:'rgba(255,255,255,.5)',cursor:'pointer',fontFamily:'inherit',fontSize:'.76rem',fontWeight:500,marginTop:'.3rem',transition:'all .15s'}}
            onMouseEnter={e=>{e.target.style.background='rgba(255,255,255,.15)';e.target.style.color='#fff'}}
            onMouseLeave={e=>{e.target.style.background='rgba(255,255,255,.08)';e.target.style.color='rgba(255,255,255,.5)'}}>
            ＋ Nouveau séjour
          </button>
        </div>

        {/* Navigation — en bas */}
        <div style={{marginTop:'auto',paddingTop:'.7rem',borderTop:'1px solid rgba(255,255,255,.1)'}}>
          {[
            {icon:'👥',label:'Voyageurs',fn:onOpenVoyageurs},
            onOpenGlobalBudget&&{icon:'💰',label:'Budget global',fn:onOpenGlobalBudget},
            isAdmin&&onOpenAdmin&&{icon:'⚙️',label:'Administration',fn:onOpenAdmin,color:'rgba(255,200,80,.85)'},
            {icon:'→',label:'Déconnexion',fn:()=>{setMenu(null);onSignOut()},color:'rgba(255,110,90,.85)'},
          ].filter(Boolean).map((item,i)=>(
            <button key={i} onClick={item.fn} style={{width:'100%',display:'flex',alignItems:'center',gap:'.45rem',padding:'.52rem .5rem',borderRadius:9,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.8rem',fontWeight:500,color:item.color||'rgba(255,255,255,.72)',textAlign:'left',marginBottom:'.06rem',transition:'background .15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{width:18,textAlign:'center',fontSize:'.95rem'}}>{item.icon}</span>{item.label}
            </button>
          ))}
          {/* User */}
          <div style={{display:'flex',alignItems:'center',gap:'.45rem',padding:'.6rem .5rem',borderRadius:9,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.1)',marginTop:'.4rem'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.75rem',fontWeight:700,color:'#fff',flexShrink:0}}>{user?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{fontSize:'.76rem',fontWeight:600,color:'#fff'}}>{user}</div>
              <div style={{fontSize:'.6rem',opacity:.4,color:'#fff'}}>Connecté{syncing?' ☁️':''}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )

  // ─── MOBILE TOP BAR (mobile uniquement) ──────────────────────────────────
  const MobileBar = () => (
    <div style={{position:'relative',overflow:'hidden',background:bg,transition:'background 2s ease'}} className="app-mobile-bar">
      {photo&&<div style={{position:'absolute',inset:0,backgroundImage:`url(${photo})`,backgroundSize:'cover',backgroundPosition:'center 35%',opacity:.25,transition:'opacity 1.5s'}}/>}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,.5) 100%)',pointerEvents:'none'}}/>
      <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.65rem .9rem'}}>
        {/* Séjours dropdown */}
        <div ref={refTrips} style={{position:'relative'}}>
          <button style={{...glassBtn,fontSize:'.78rem',padding:'5px 10px',borderRadius:10}} onClick={()=>tog('trips')}>
            🥾 <span style={{maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}}>{activeTrip?.name||'Séjours'}</span>
            <span style={{fontSize:'.55rem',opacity:.5}}>{menu==='trips'?'▴':'▾'}</span>
          </button>
          {menu==='trips'&&(
            <div style={{...dd,left:0,maxWidth:'calc(100vw - 1.8rem)'}}>
              <div style={{padding:'.4rem .85rem',fontSize:'.62rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)',borderBottom:'1px solid var(--border)'}}>Mes séjours</div>
              {trips.map((t,i)=>{
                const color=t.color||TRIP_COLORS[i%TRIP_COLORS.length]
                const active=t.id===activeTrip?.id
                return(
                  <div key={t.id} style={{display:'flex',alignItems:'center',gap:'.45rem',padding:'.52rem .85rem',background:active?'#f5f4f0':'#fff',borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>{onSelectTrip(t.id);setMenu(null)}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                    <span style={{fontSize:'.83rem',fontWeight:active?600:400,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</span>
                  </div>
                )
              })}
              <button style={{width:'100%',padding:'.55rem .85rem',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.83rem',fontWeight:600,color:'var(--green)',textAlign:'left'}} onClick={()=>{onNewTrip();setMenu(null)}}>＋ Nouveau séjour</button>
            </div>
          )}
        </div>

        {/* Heure */}
        <div style={{fontFamily:'monospace',color:'#fff',fontSize:'.9rem',fontWeight:500}}>{time.local}</div>

        {/* Compte dropdown */}
        <div ref={refAccount} style={{position:'relative'}}>
          <button style={{...glassBtn,borderRadius:'50%',width:32,height:32,padding:0,justifyContent:'center',fontSize:'.82rem'}} onClick={()=>tog('account')}>
            {user?.charAt(0).toUpperCase()}
          </button>
          {menu==='account'&&(
            <div style={{...dd,right:0}}>
              <div style={{padding:'.65rem .95rem',borderBottom:'1px solid var(--border)',background:'#f8f7fc'}}>
                <div style={{fontSize:'.82rem',fontWeight:600}}>{user}</div>
                <div style={{fontSize:'.65rem',color:'var(--text-muted)'}}>Connecté</div>
              </div>
              <button style={mi} onClick={()=>{onOpenVoyageurs();setMenu(null)}}><span>👥</span>Voyageurs</button>
              {onOpenGlobalBudget&&<button style={mi} onClick={()=>{onOpenGlobalBudget();setMenu(null)}}><span>💰</span>Budget global</button>}
              {isAdmin&&onOpenAdmin&&<button style={{...mi,color:'#8F4E20'}} onClick={()=>{onOpenAdmin();setMenu(null)}}><span>⚙️</span>Administration</button>}
              {onSignOut&&<button style={{...mi,color:'var(--red)',borderTop:'1px solid var(--border)'}} onClick={()=>{setMenu(null);onSignOut()}}><span>🚪</span>Déconnexion</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Sidebar />
      <MobileBar />
    </>
  )
}

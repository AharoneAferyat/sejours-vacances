import { useState, useEffect, useRef } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

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

export default function AppHeader({
  trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip,
  voyageurs, onOpenVoyageurs, syncing, onSignOut, userEmail,
  onOpenGlobalBudget, isAdmin, onOpenAdmin,
  // onglet actif passé depuis App.jsx
  tab, setTab
}) {
  const [time, setTime] = useState({local:'',dateFR:'',utc:''})
  const [bg, setBg] = useState(getBg())
  const [mobileMenu, setMobileMenu] = useState(null) // null | 'trips' | 'account'
  const refTrips = useRef(null)
  const refAccount = useRef(null)

  useEffect(()=>{
    const tick=()=>{
      const n=new Date()
      const dFR=['dim','lun','mar','mer','jeu','ven','sam']
      const mFR=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
      setTime({
        local:n.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
        dateFR:`${dFR[n.getDay()]} ${n.getDate()} ${mFR[n.getMonth()]} ${n.getFullYear()}`,
        utc:n.toUTCString().split(' ')[4],
      })
    }
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[])

  useEffect(()=>{
    setBg(getBg())
    const id=setInterval(()=>setBg(getBg()),60000)
    return()=>clearInterval(id)
  },[])

  // Ferme menus mobile au clic dehors
  useEffect(()=>{
    const fn=e=>{
      if(!refTrips.current?.contains(e.target)&&!refAccount.current?.contains(e.target))
        setMobileMenu(null)
    }
    document.addEventListener('mousedown',fn)
    return()=>document.removeEventListener('mousedown',fn)
  },[])

  const tog=m=>setMobileMenu(p=>p===m?null:m)
  const user=userEmail?.includes('@')?userEmail.split('@')[0]:userEmail?.slice(0,12)

  const NAV_ITEMS = [
    {id:'dashboard',icon:'🏠', label:'Tableau de bord'},
    {id:'planning', icon:'📋', label:'Planning'},
    {id:'infos',    icon:'ℹ️',  label:'Infos'},
    {id:'budget',   icon:'💰', label:'Budget'},
    {id:'valise',   icon:'🧳', label:'Valise'},
    {id:'sac',      icon:'🎒', label:'Sac à dos'},
    {id:'ai',       icon:'🤖', label:'IA Activités'},
    ...(isAdmin ? [{id:'admin', icon:'⚙️', label:'Administration', color:'rgba(255,200,80,.85)'}] : []),
  ]

  const dd={
    position:'absolute',top:'calc(100% + 7px)',zIndex:600,
    background:'#fff',borderRadius:16,border:'1px solid rgba(0,0,0,.07)',
    boxShadow:'0 8px 32px rgba(0,0,0,.14)',minWidth:210,overflow:'hidden',
  }
  const mi={width:'100%',padding:'.6rem .95rem',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.83rem',fontWeight:500,color:'var(--text)',display:'flex',alignItems:'center',gap:'.55rem',textAlign:'left'}
  const glassBtn={background:'rgba(255,255,255,.13)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.22)',borderRadius:11,padding:'6px 12px',color:'#fff',cursor:'pointer',fontFamily:'inherit',fontWeight:500,fontSize:'.78rem',display:'flex',alignItems:'center',gap:'.35rem',whiteSpace:'nowrap'}

  // ── SIDEBAR DESKTOP ───────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="app-sidebar" style={{background:bg,transition:'background 2s ease'}}>
      {/* Logo */}
      <div style={{padding:'1.25rem 1rem .9rem',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'.55rem',marginBottom:'.9rem'}}>
          <span style={{fontSize:'1.2rem'}}>🥾</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:'.9rem',fontWeight:700,color:'#fff',lineHeight:1.15}}>Séjours<br/>Vacances</span>
        </div>

      </div>

      {/* Onglets navigation */}
      <div style={{flex:1,padding:'.65rem .9rem',overflowY:'auto'}}>
        <div style={{fontSize:'.58rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.09em',color:'rgba(255,255,255,.38)',marginBottom:'.35rem'}}>Navigation</div>
        {NAV_ITEMS.map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id)}
            style={{width:'100%',display:'flex',alignItems:'center',gap:'.5rem',padding:'.5rem .55rem',borderRadius:9,background:tab===item.id?'rgba(255,255,255,.18)':'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.81rem',fontWeight:tab===item.id?600:400,color:tab===item.id?'#fff':'rgba(255,255,255,.72)',textAlign:'left',marginBottom:'.05rem',transition:'all .15s'}}
            onMouseEnter={e=>{if(tab!==item.id)e.currentTarget.style.background='rgba(255,255,255,.1)'}}
            onMouseLeave={e=>{if(tab!==item.id)e.currentTarget.style.background='transparent'}}>
            <span style={{width:20,textAlign:'center'}}>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>

      {/* Bas : nav secondaire + user */}
      <div style={{padding:'.65rem .9rem',borderTop:'1px solid rgba(255,255,255,.08)'}}>
        {[
          {icon:'👥',label:'Voyageurs',fn:onOpenVoyageurs},
          onOpenGlobalBudget&&{icon:'💰',label:'Budget global',fn:onOpenGlobalBudget},

          {icon:'→',label:'Déconnexion',fn:()=>{setMobileMenu(null);onSignOut()},color:'rgba(255,110,90,.85)'},
        ].filter(Boolean).map((item,i)=>(
          <button key={i} onClick={item.fn}
            style={{width:'100%',display:'flex',alignItems:'center',gap:'.45rem',padding:'.46rem .5rem',borderRadius:9,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.79rem',fontWeight:500,color:item.color||'rgba(255,255,255,.68)',textAlign:'left',marginBottom:'.04rem',transition:'background .15s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{width:18,textAlign:'center',fontSize:'.9rem'}}>{item.icon}</span>{item.label}
          </button>
        ))}
        {/* User */}
        <div style={{display:'flex',alignItems:'center',gap:'.45rem',padding:'.55rem .5rem',borderRadius:9,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',marginTop:'.35rem'}}>
          <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:700,color:'#fff',flexShrink:0}}>{user?.charAt(0).toUpperCase()}</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:'.74rem',fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user}</div>
            <div style={{fontSize:'.58rem',opacity:.38,color:'#fff'}}>Connecté{syncing?' ☁️':''}</div>
          </div>
        </div>
      </div>
    </aside>
  )

  // ── MOBILE TOP BAR ────────────────────────────────────────────────────────
  const MobileBar = () => (
    <div className="app-mobile-bar" style={{background:bg,transition:'background 2s ease'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.65rem .9rem'}}>
        {/* Séjour actif */}
        <div ref={refTrips} style={{position:'relative'}}>
          <button style={glassBtn} onClick={()=>tog('trips')}>
            🥾 <span style={{maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{activeTrip?.name||'Séjours'}</span>
            <span style={{fontSize:'.55rem',opacity:.5}}>{mobileMenu==='trips'?'▴':'▾'}</span>
          </button>
          {mobileMenu==='trips'&&(
            <div style={{...dd,left:0,maxWidth:'calc(100vw - 1.8rem)'}}>
              <div style={{padding:'.4rem .85rem',fontSize:'.62rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)',borderBottom:'1px solid var(--border)'}}>Mes séjours</div>
              {trips.map((t,i)=>{
                const color=t.color||TRIP_COLORS[i%TRIP_COLORS.length],active=t.id===activeTrip?.id
                return(
                  <div key={t.id} style={{display:'flex',alignItems:'center',gap:'.45rem',padding:'.5rem .85rem',background:active?'#f5f4f0':'#fff',borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>{onSelectTrip(t.id);setMobileMenu(null)}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                    <span style={{fontSize:'.83rem',fontWeight:active?600:400,color:'var(--text)'}}>{t.name}</span>
                  </div>
                )
              })}
              <button style={{width:'100%',padding:'.52rem .85rem',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.83rem',fontWeight:600,color:'var(--green)',textAlign:'left'}} onClick={()=>{onNewTrip();setMobileMenu(null)}}>＋ Nouveau séjour</button>
            </div>
          )}
        </div>

        {/* Heure */}
        <div style={{fontFamily:'monospace',color:'#fff',fontSize:'.88rem',fontWeight:500}}>{time.local}</div>

        {/* Compte */}
        <div ref={refAccount} style={{position:'relative'}}>
          <button style={{...glassBtn,borderRadius:'50%',width:32,height:32,padding:0,justifyContent:'center',fontSize:'.8rem'}} onClick={()=>tog('account')}>
            {user?.charAt(0).toUpperCase()}
          </button>
          {mobileMenu==='account'&&(
            <div style={{...dd,right:0}}>
              <div style={{padding:'.62rem .92rem',borderBottom:'1px solid var(--border)',background:'#f8f7fc'}}>
                <div style={{fontSize:'.82rem',fontWeight:600}}>{user}</div>
                <div style={{fontSize:'.64rem',color:'var(--text-muted)'}}>Connecté</div>
              </div>
              <button style={mi} onClick={()=>{onOpenVoyageurs();setMobileMenu(null)}}><span>👥</span>Voyageurs</button>
              {onOpenGlobalBudget&&<button style={mi} onClick={()=>{onOpenGlobalBudget();setMobileMenu(null)}}><span>💰</span>Budget global</button>}
              {isAdmin&&onOpenAdmin&&<button style={{...mi,color:'#8F4E20'}} onClick={()=>{onOpenAdmin();setMobileMenu(null)}}><span>⚙️</span>Administration</button>}
              {onSignOut&&<button style={{...mi,color:'var(--red)',borderTop:'1px solid var(--border)'}} onClick={()=>{setMobileMenu(null);onSignOut()}}><span>🚪</span>Déconnexion</button>}
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

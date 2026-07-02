import { useState, useEffect, useRef } from 'react'

const TRIP_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']

// Photos spécifiques par destination (vraie photo de l'endroit)
const DEST_PHOTOS = {
  // France
  'paris':'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80&fit=crop',
  'lyon':'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=1600&q=80&fit=crop',
  'marseille':'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=1600&q=80&fit=crop',
  'toulouse':'https://images.unsplash.com/photo-1582764885765-f32ce06c7585?w=1600&q=80&fit=crop',
  'bordeaux':'https://images.unsplash.com/photo-1593352216840-1aee13f45818?w=1600&q=80&fit=crop',
  'nice':'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1600&q=80&fit=crop',
  'strasbourg':'https://images.unsplash.com/photo-1608026043972-0a1c08e6e787?w=1600&q=80&fit=crop',
  'montpellier':'https://images.unsplash.com/photo-1592318474000-1b22ff26e1f3?w=1600&q=80&fit=crop',
  'nantes':'https://images.unsplash.com/photo-1605627079912-97c3810a11a4?w=1600&q=80&fit=crop',
  'lille':'https://images.unsplash.com/photo-1577168519532-3d05e7c78d8e?w=1600&q=80&fit=crop',
  'grenoble':'https://images.unsplash.com/photo-1583425423320-1a6b1a2a5d30?w=1600&q=80&fit=crop',
  'annecy':'https://images.unsplash.com/photo-1609250353656-0b3e8201da88?w=1600&q=80&fit=crop',
  'chamonix':'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=1600&q=80&fit=crop',
  'corse':'https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w=1600&q=80&fit=crop',
  'biarritz':'https://images.unsplash.com/photo-1598978483038-02df04aba437?w=1600&q=80&fit=crop',
  'avignon':'https://images.unsplash.com/photo-1588172028879-25a13e1e9ef8?w=1600&q=80&fit=crop',
  'bretagne':'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1600&q=80&fit=crop',
  // Europe
  'barcelone':'https://images.unsplash.com/photo-1583422409516-2895a77efed6?w=1600&q=80&fit=crop',
  'barcelona':'https://images.unsplash.com/photo-1583422409516-2895a77efed6?w=1600&q=80&fit=crop',
  'londres':'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80&fit=crop',
  'london':'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80&fit=crop',
  'amsterdam':'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1600&q=80&fit=crop',
  'rome':'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80&fit=crop',
  'roma':'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80&fit=crop',
  'berlin':'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1600&q=80&fit=crop',
  'madrid':'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1600&q=80&fit=crop',
  'lisbonne':'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=1600&q=80&fit=crop',
  'venise':'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1600&q=80&fit=crop',
  'prague':'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1600&q=80&fit=crop',
  'vienne':'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1600&q=80&fit=crop',
  'athènes':'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1600&q=80&fit=crop',
  'dublin':'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1600&q=80&fit=crop',
  'zurich':'https://images.unsplash.com/photo-1515488764276-beab0607c7ca?w=1600&q=80&fit=crop',
  'istanbul':'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600&q=80&fit=crop',
  'santorini':'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80&fit=crop',
  'santorin':'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80&fit=crop',
  'dubrovnik':'https://images.unsplash.com/photo-1555990793-da11153b2473?w=1600&q=80&fit=crop',
  'bruxelles':'https://images.unsplash.com/photo-1559113202-c916b8e44373?w=1600&q=80&fit=crop',
  // Monde
  'new york':'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&q=80&fit=crop',
  'tokyo':'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=80&fit=crop',
  'dubai':'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80&fit=crop',
  'bali':'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80&fit=crop',
  'marrakech':'https://images.unsplash.com/photo-1597211833712-5e41faa202ea?w=1600&q=80&fit=crop',
  'maroc':'https://images.unsplash.com/photo-1597211833712-5e41faa202ea?w=1600&q=80&fit=crop',
  'islande':'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1600&q=80&fit=crop',
  'norvège':'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80&fit=crop',
  'canada':'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1600&q=80&fit=crop',
  'japon':'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=80&fit=crop',
  'grèce':'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80&fit=crop',
  'thailande':'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1600&q=80&fit=crop',
  'mexique':'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1600&q=80&fit=crop',
  'egypte':'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1600&q=80&fit=crop',
}

// Fallback par type si la destination exacte n'est pas trouvée
const TYPE_PHOTOS = {
  mountain: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&fit=crop',
  beach:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80&fit=crop',
  city:     'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80&fit=crop',
  forest:   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80&fit=crop',
  lake:     'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1600&q=80&fit=crop',
  admin:    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80&fit=crop',
  default:  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80&fit=crop',
}

function getPhoto(name='', dest='') {
  const t = (name + ' ' + dest).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // 1. Chercher une correspondance exacte dans le mapping
  for (const [key, url] of Object.entries(DEST_PHOTOS)) {
    const k = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (t.includes(k)) return url
  }
  
  // 2. Fallback par type de paysage
  if (/mont|alp|ski|neige|glacier|pyren|sommet|altitude|col |trek/.test(t)) return TYPE_PHOTOS.mountain
  if (/mer|ocean|plage|cote|beach|sea|surf|ile |island/.test(t)) return TYPE_PHOTOS.beach
  if (/foret|bois|nature|campagne|parc|arbre|jungle/.test(t)) return TYPE_PHOTOS.forest
  if (/lac|riviere|cascade|gorge|canyon/.test(t)) return TYPE_PHOTOS.lake
  if (/ville|city|urban|centre/.test(t)) return TYPE_PHOTOS.city
  
  // 3. Défaut
  return TYPE_PHOTOS.default
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

export default function MainHeader({ trips, activeTrip, onSelectTrip, onNewTrip, onEditTrip, onDeleteTrip, onOpenVoyageurs, onOpenGlobalBudget, isAdmin, onOpenAdmin, onSignOut, userEmail, syncing, tab, onUpdatePhoto }) {
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
    if (!activeTrip || tab === 'admin') {
      setPhoto(tab === 'admin' ? TYPE_PHOTOS.admin : null)
      return
    }
    
    // Si le séjour a déjà une photo stockée, l'utiliser directement
    if (activeTrip.headerPhoto) {
      setPhoto(activeTrip.headerPhoto)
      return
    }
    
    // Sinon : essayer Unsplash, fallback sur le mapping local
    const dest = activeTrip.destination || activeTrip.name || ''
    const fallback = getPhoto(activeTrip.name || '', dest)
    
    // Charger le fallback immédiatement
    setPhoto(fallback)
    
    // Puis tenter Unsplash en background
    if (dest) {
      fetch(`/api/unsplash?q=${encodeURIComponent(dest + ' landscape travel')}`)
        .then(r => r.json())
        .then(data => {
          if (data.url) {
            setPhoto(data.url)
            // Stocker dans le séjour pour ne pas re-fetcher
            if (typeof onUpdatePhoto === 'function') onUpdatePhoto(data.url)
          }
        })
        .catch(() => {}) // Silently fail, fallback already loaded
    }
  }, [activeTrip?.id, tab])

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

      {/* Titre + horloge centrés */}
      <div style={{ position:'relative', zIndex:1, textAlign:'center', padding:'clamp(.75rem,2vw,1rem) 1.5rem clamp(.6rem,1.5vw,.8rem)', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', flexDirection:'column', alignItems:'center', gap:'.35rem' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(.95rem,3vw,1.6rem)', fontWeight:700, background:'linear-gradient(135deg,#fff,rgba(255,255,255,.78))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          Séjours Vacances
        </div>
        <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', background:'rgba(255,255,255,.08)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,.12)', borderRadius:14, padding:'clamp(.3rem,1vw,.45rem) clamp(.8rem,3vw,1.4rem)', gap:'.04rem' }}>
          <span style={{ fontFamily:'monospace', fontSize:'clamp(.65rem,2vw,.78rem)', opacity:.82, fontWeight:500 }}>{time.dateFR}</span>
          <div style={{ display:'flex', alignItems:'baseline', gap:'.3rem' }}>
            <span style={{ fontFamily:'monospace', fontSize:'clamp(1.1rem,5vw,1.6rem)', fontWeight:300, letterSpacing:'.04em' }}>{time.local}</span>
            {syncing && <span style={{ opacity:.35, fontSize:'.7rem' }}>☁️</span>}
          </div>
          <span style={{ fontFamily:'monospace', opacity:.38, fontSize:'clamp(.55rem,1.5vw,.65rem)', fontWeight:500 }}>UTC {time.utc} · {time.dateEN}</span>
        </div>
      </div>

      {/* Onglets séjours redesignés — masqués en admin */}
      {tab !== 'admin' && <div style={{ position:'relative', zIndex:1, display:'flex', gap:'.35rem', padding:'.45rem clamp(.75rem,3vw,1.5rem)', overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch', alignItems:'center' }}>
        {trips.map((t, i) => {
          const color = t.color || TRIP_COLORS[i % TRIP_COLORS.length]
          const active = t.id === activeTrip?.id
          return (
            <div key={t.id} className="trip-tab-pill" style={{ display:'flex', alignItems:'center', gap:0, background:active?color:'rgba(255,255,255,.12)', border:`1.5px solid ${active?color:'rgba(255,255,255,.2)'}`, borderRadius:10, overflow:'hidden', flexShrink:0, transition:'all .2s' }}>
              <button onClick={() => onSelectTrip(t.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:'6px 12px', color:'#fff', fontFamily:'inherit', fontSize:'.8rem', fontWeight:active?600:400, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:1 }}>
                <span>{t.name}</span>
                {t.startDate && <span style={{ fontSize:'.6rem', opacity:.7 }}>{new Date(t.startDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} → {new Date(t.endDate+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>}
              </button>
              <div style={{ display:'flex', flexDirection:'column', gap:1, paddingRight:6, opacity:.6 }}>
                <button onClick={() => onEditTrip(t)} title="Modifier" style={{ background:'none', border:'none', cursor:'pointer', fontSize:'.65rem', color:'#fff', padding:'1px 2px', lineHeight:1 }}>✏️</button>
                <button onClick={() => confirm(`Supprimer "${t.name}" ?${trips.length === 1 ? '\nC\'est ton seul séjour, tu seras redirigé vers la page d\'accueil.' : ''}`) && onDeleteTrip(t.id)} title="Supprimer" style={{ background:'none', border:'none', cursor:'pointer', fontSize:'.65rem', color:'#fff', padding:'1px 2px', lineHeight:1 }}>🗑</button>
              </div>
            </div>
          )
        })}
        <button onClick={onNewTrip} style={{ background:'rgba(255,255,255,.1)', border:'1px dashed rgba(255,255,255,.3)', borderRadius:10, padding:'6px 12px', color:'rgba(255,255,255,.7)', cursor:'pointer', fontFamily:'inherit', fontSize:'.78rem', fontWeight:500, whiteSpace:'nowrap', transition:'all .15s' }}>＋ Nouveau</button>
      </div>}
    </div>
  )
}

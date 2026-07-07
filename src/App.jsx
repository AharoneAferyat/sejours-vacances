import { useState, useEffect } from 'react'
import { useStore } from './hooks/useStore'
import { getTodayStr, genId, formatDate, displayToISO } from './utils'
import { validateInviteCode, consumeInviteCode, adminLoadUserData, adminUpdateTrip, adminAddActivity, adminUpdateActivity, adminDeleteActivity, adminValidateDay } from './firebase'
import Header from './components/Header'
import EmptyState from './components/EmptyState'
import Dashboard from './components/Dashboard'
import JoinTripModal from './components/JoinTripModal'
import MainHeader from './components/MainHeader'
import BottomNav from './components/BottomNav'
import WeatherStrip from './components/WeatherStrip'
import { useWeather } from './hooks/useWeather'
import TodayZone from './components/TodayZone'
import DayCard from './components/DayCard'
import CheckList from './components/CheckList'
import TripForm from './components/TripForm'
import VoyageursModal from './components/VoyageursModal'
import InfosTab from './components/InfosTab'
import Budget from './components/Budget'
import GlobalBudget from './components/GlobalBudget'
import AIRandoSearch from './components/AIRandoSearch'
import DangerAlert from './components/DangerAlert'
import AdminPanel from './components/AdminPanel'


function InviteScreen({ onBack, onSuccess }) {
  const [code, setCode] = useState('')
  const [step, setStep] = useState('enter') // 'enter' | 'valid' | 'done'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validatedCode, setValidatedCode] = useState(null)

  const handleValidate = async () => {
    if (!code.trim()) return
    setLoading(true); setError('')
    const result = await validateInviteCode(code.trim())
    setLoading(false)
    if (result.error) return setError(result.error)
    setValidatedCode(code.trim().toUpperCase())
    setStep('valid')
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    const user = await onSuccess()
    if (user && validatedCode) {
      await consumeInviteCode(validatedCode, user.uid, user.email)
    }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:'1.5rem', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'1.5rem' }}>
      <div style={{ fontSize:'3rem' }}>✉️</div>
      <div style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(1.2rem, 4vw, 1.6rem)', fontWeight:700, color:'#fff', textAlign:'center' }}>Code d'invitation</div>

      {step === 'enter' && (
        <div style={{ background:'rgba(255,255,255,.08)', borderRadius:14, padding:'1.5rem', width:'100%', maxWidth:340, border:'1px solid rgba(255,255,255,.15)' }}>
          <div style={{ fontSize:'.83rem', color:'rgba(255,255,255,.7)', marginBottom:'1rem', textAlign:'center' }}>
            Entre le code d'invitation que tu as reçu
          </div>
          <input
            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="INV-XXXXXX"
            style={{ width:'100%', background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)', borderRadius:9, padding:'10px 12px', color:'#fff', fontFamily:'monospace', fontSize:'1.1rem', outline:'none', textAlign:'center', letterSpacing:'.1em', boxSizing:'border-box', marginBottom:'.75rem' }}
            onKeyDown={e => e.key === 'Enter' && handleValidate()}
          />
          {error && <div style={{ fontSize:'.78rem', color:'#fca5a5', marginBottom:'.6rem', textAlign:'center' }}>{error}</div>}
          <button onClick={handleValidate} disabled={loading || !code.trim()} style={{
            width:'100%', background:'var(--green)', color:'#fff', border:'none', borderRadius:9,
            padding:'10px', fontSize:'.9rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit'
          }}>
            {loading ? '⏳ Vérification…' : 'Vérifier le code'}
          </button>
        </div>
      )}

      {step === 'valid' && (
        <div style={{ background:'rgba(255,255,255,.08)', borderRadius:14, padding:'1.5rem', width:'100%', maxWidth:340, border:'1px solid rgba(255,255,255,.15)', textAlign:'center' }}>
          <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>✅</div>
          <div style={{ color:'#fff', fontWeight:600, marginBottom:'.4rem' }}>Code valide !</div>
          <div style={{ fontSize:'.82rem', color:'rgba(255,255,255,.65)', marginBottom:'1.25rem' }}>
            Connecte-toi avec Google pour créer ton compte et accéder à l'application.
          </div>
          <button onClick={handleGoogleSignIn} disabled={loading} style={{
            width:'100%', background:'#fff', color:'#1a1a1a', border:'none', borderRadius:10,
            padding:'11px 24px', fontSize:'.92rem', fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'.75rem', fontFamily:'inherit'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {loading ? 'Connexion…' : 'Continuer avec Google'}
          </button>
        </div>
      )}

      <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,.5)', cursor:'pointer', fontSize:'.83rem', fontFamily:'inherit' }}>
        ← Retour
      </button>
    </div>
  )
}

function LoginScreen({ onGoogleSignIn, onCodeLogin, onInviteLogin }) {
  const [showCode, setShowCode] = useState(false)
  const [codeName, setCodeName] = useState('')
  const [codePass, setCodePass] = useState('')
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCodeLogin = async () => {
    if (!codeName.trim() || !codePass.trim()) return setCodeError('Remplis les deux champs')
    setLoading(true)
    setCodeError('')
    const result = await onCodeLogin(codeName.trim(), codePass.trim())
    setLoading(false)
    if (result?.error) setCodeError(result.error)
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:'1.5rem', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'1.5rem' }}>
      <div style={{ fontSize:'3rem' }}>🏔</div>
      <div style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(1.4rem, 5vw, 2rem)', fontWeight:700, color:'#fff', textAlign:'center' }}>Séjours Vacances</div>
      <div style={{ fontSize:'.9rem', color:'rgba(255,255,255,.7)', textAlign:'center' }}>Connecte-toi pour accéder à tes séjours</div>

      {!showCode ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'.75rem', width:'100%', maxWidth:320 }}>
          <button onClick={onGoogleSignIn} style={{
            background:'#fff', color:'#1a1a18', border:'none', borderRadius:12,
            padding:'12px 24px', fontSize:'.95rem', fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'.75rem', fontFamily:'inherit',
            boxShadow:'0 4px 20px rgba(0,0,0,.3)', width:'100%'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuer avec Google
          </button>
          <button onClick={() => setShowCode(true)} style={{
            background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.8)', border:'1px solid rgba(255,255,255,.2)',
            borderRadius:12, padding:'12px 24px', fontSize:'.9rem', fontWeight:500, cursor:'pointer',
            fontFamily:'inherit', width:'100%'
          }}>
            🔑 Rejoindre avec un code
          </button>
          <button onClick={() => onInviteLogin()} style={{
            background:'rgba(255,255,255,.06)', color:'rgba(255,255,255,.5)', border:'1px solid rgba(255,255,255,.1)',
            borderRadius:12, padding:'10px 24px', fontSize:'.8rem', fontWeight:400, cursor:'pointer',
            fontFamily:'inherit', width:'100%'
          }}>
            ✉️ J'ai un code d'invitation
          </button>
        </div>
      ) : (
        <div style={{ background:'rgba(255,255,255,.08)', borderRadius:14, padding:'1.25rem', width:'100%', maxWidth:320, border:'1px solid rgba(255,255,255,.15)' }}>
          <div style={{ color:'#fff', fontWeight:600, marginBottom:'.85rem', fontSize:'.9rem' }}>🔑 Rejoindre avec un code</div>
          <div style={{ marginBottom:'.6rem' }}>
            <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.5)', marginBottom:'.25rem', textTransform:'uppercase', letterSpacing:'.05em' }}>Nom</div>
            <input value={codeName} onChange={e => setCodeName(e.target.value)} placeholder="Ton prénom"
              style={{ width:'100%', background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'8px 10px', color:'#fff', fontFamily:'inherit', fontSize:'.88rem', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:'.85rem' }}>
            <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.5)', marginBottom:'.25rem', textTransform:'uppercase', letterSpacing:'.05em' }}>Code</div>
            <input value={codePass} onChange={e => setCodePass(e.target.value)} placeholder="Code d'accès"
              style={{ width:'100%', background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'8px 10px', color:'#fff', fontFamily:'inherit', fontSize:'.88rem', outline:'none', boxSizing:'border-box' }}
              onKeyDown={e => e.key === 'Enter' && handleCodeLogin()} />
          </div>
          {codeError && <div style={{ fontSize:'.78rem', color:'#fca5a5', marginBottom:'.6rem' }}>{codeError}</div>}
          <div style={{ display:'flex', gap:'.5rem' }}>
            <button onClick={() => setShowCode(false)} style={{ flex:1, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', borderRadius:9, padding:'9px', color:'rgba(255,255,255,.7)', cursor:'pointer', fontFamily:'inherit', fontSize:'.85rem' }}>
              ← Retour
            </button>
            <button onClick={handleCodeLogin} disabled={loading} style={{ flex:2, background:'#0F6E56', border:'none', borderRadius:9, padding:'9px', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'.88rem', opacity: loading ? .7 : 1 }}>
              {loading ? '⏳ Vérification…' : 'Accéder'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState('dashboard')
  const [shareCode, setShareCode] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('share') || null
  })
  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [showVoyageurs, setShowVoyageurs] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showGlobalBudget, setShowGlobalBudget] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showInviteScreen, setShowInviteScreen] = useState(false)
  const [aiTargetDayId, setAiTargetDayId] = useState(null)
  const [scrollToDayId, setScrollToDayId] = useState(null)
  const [activeDestIdx, setActiveDestIdx] = useState(0) // multi-destination: which destination is active
  const [showAddDest, setShowAddDest] = useState(false)

  // Admin mode: manage another user's trip
  const [adminMode, setAdminMode] = useState(null)
  const [adminVid, setAdminVid] = useState(null) // { uid, email, trip, trips }
  const [adminTab, setAdminTab] = useState('planning')

  const enterAdminMode = async (user, tripData) => {
    // Load fresh data from Firebase
    const userData = await adminLoadUserData(user.uid)
    if (!userData?.trips) return alert('Impossible de charger les données de cet utilisateur.')
    const freshTrip = userData.trips.find(t => t.id === tripData.id)
    if (!freshTrip) return alert('Séjour introuvable.')
    setAdminMode({ uid: user.uid, email: user.email, trip: freshTrip, trips: userData.trips })
    setAdminVid(freshTrip.voyageurs?.[0]?.id || null)
    setAdminTab('planning')
    setTab('planning')
  }

  const refreshAdminTrip = async () => {
    if (!adminMode) return
    const userData = await adminLoadUserData(adminMode.uid)
    if (!userData?.trips) return
    const freshTrip = userData.trips.find(t => t.id === adminMode.trip.id)
    if (freshTrip) setAdminMode(prev => ({ ...prev, trip: freshTrip, trips: userData.trips }))
  }

  const adminUpdateTripLocal = async (changes) => {
    if (!adminMode) return
    const ok = await adminUpdateTrip(adminMode.uid, adminMode.trip.id, changes)
    if (ok) {
      setAdminMode(prev => ({ ...prev, trip: { ...prev.trip, ...changes } }))
    }
  }

  // Admin-aware wrappers
  const doAddActivity = async (tripId, dayId, act) => {
    if (adminMode) { const ok = await adminAddActivity(adminMode.uid, tripId, dayId, act); if (ok) refreshAdminTrip() }
    else if (isMultiDest) { const nd = destDays.map(d => d.id === dayId ? { ...d, activities: [...(d.activities||[]), act] } : d); saveDestDays(nd) } else store.addActivity(tripId, dayId, act)
  }
  const doUpdateActivity = async (tripId, dayId, actId, ch) => {
    if (adminMode) { const ok = await adminUpdateActivity(adminMode.uid, tripId, dayId, actId, ch); if (ok) refreshAdminTrip() }
    else if (isMultiDest) { const nd = destDays.map(d => d.id === dayId ? { ...d, activities: (d.activities||[]).map(a => a.id === actId ? {...a,...ch} : a) } : d); saveDestDays(nd) } else store.updateActivity(tripId, dayId, actId, ch)
  }
  const doDeleteActivity = async (tripId, dayId, actId) => {
    if (adminMode) { const ok = await adminDeleteActivity(adminMode.uid, tripId, dayId, actId); if (ok) refreshAdminTrip() }
    else if (isMultiDest) { const nd = destDays.map(d => d.id === dayId ? { ...d, activities: (d.activities||[]).filter(a => a.id !== actId) } : d); saveDestDays(nd) } else store.deleteActivity(tripId, dayId, actId)
  }
  const doValidateDay = async (tripId, dayId) => {
    if (adminMode) { const ok = await adminValidateDay(adminMode.uid, tripId, dayId); if (ok) refreshAdminTrip() }
    else if (isMultiDest) { const nd = destDays.map(d => d.id === dayId ? { ...d, validated: !d.validated } : d); saveDestDays(nd) } else store.validateDay(tripId, dayId)
  }
  const doValidateActivity = async (tripId, dayId, actId) => {
    if (adminMode) {
      const day = adminMode.trip.days?.find(d => d.id === dayId)
      const act = day?.activities?.find(a => a.id === actId)
      if (act) { const ok = await adminUpdateActivity(adminMode.uid, tripId, dayId, actId, { done: !act.done }); if (ok) refreshAdminTrip() }
    } else if (isMultiDest) { const nd = destDays.map(d => d.id === dayId ? { ...d, activities: (d.activities||[]).map(a => a.id === actId ? {...a, done: !a.done} : a) } : d); saveDestDays(nd) } else store.validateActivity(tripId, dayId, actId)
  }

  const realTrip = store.activeTrip
  const isAdminManaging = !!adminMode

  // In admin mode, use the managed user's data entirely
  const trips = isAdminManaging ? (adminMode.trips || []) : store.trips
  const trip = isAdminManaging ? adminMode.trip : realTrip
  const today = getTodayStr()

  // Multi-destination resolution
  const isMultiDest = trip?.destinations?.length > 0
  const destinations = isMultiDest ? trip.destinations : (trip ? [{ id: 'default', name: trip.destination, startDate: trip.startDate, endDate: trip.endDate, color: trip.color, lat: trip.lat, lon: trip.lon, headerPhoto: trip.headerPhoto, accommodation: trip.accommodation, accommodationPhone: trip.accommodationPhone, days: trip.days || [] }] : [])
  const activeDest = destinations[activeDestIdx] || destinations[0] || null
  // Scoped data from active destination
  const destDays = isMultiDest ? (activeDest?.days || []) : (trip?.days || [])
  const destLat = activeDest?.lat || null
  const destLon = activeDest?.lon || null
  const destColor = activeDest?.color || trip?.color || '#0F6E56'
  const destPhoto = activeDest?.headerPhoto || trip?.headerPhoto || null
  const destName = activeDest?.name || trip?.destination || ''
  const destAccommodation = activeDest?.accommodation || trip?.accommodation || ''
  const vid = isAdminManaging ? (adminVid || trip?.voyageurs?.[0]?.id || null) : store.activeVoyageurId

  // Admin: valise/sac data from managed trip
  const adminVoyageurData = isAdminManaging ? (adminMode.trip.voyageurData?.[vid] || {}) : {}
  const adminValise = adminVoyageurData.valise || []
  const adminSac = adminVoyageurData.sac || []

  const adminToggleItem = async (listKey, itemId) => {
    const vd = adminMode.trip.voyageurData || {}
    const myVd = vd[vid] || {}
    const items = (myVd[listKey] || []).map(i => i.id === itemId ? { ...i, done: !i.done } : i)
    await adminUpdateTripLocal({ voyageurData: { ...vd, [vid]: { ...myVd, [listKey]: items } } })
  }
  const adminAddItem = async (listKey, text) => {
    const vd = adminMode.trip.voyageurData || {}
    const myVd = vd[vid] || {}
    const items = [...(myVd[listKey] || []), { id: 'item_' + Date.now(), text, done: false, qty: 1 }]
    await adminUpdateTripLocal({ voyageurData: { ...vd, [vid]: { ...myVd, [listKey]: items } } })
  }
  const adminRemoveItem = async (listKey, itemId) => {
    const vd = adminMode.trip.voyageurData || {}
    const myVd = vd[vid] || {}
    const items = (myVd[listKey] || []).filter(i => i.id !== itemId)
    await adminUpdateTripLocal({ voyageurData: { ...vd, [vid]: { ...myVd, [listKey]: items } } })
  }
  const adminUpdateItemQty = async (listKey, itemId, qty) => {
    const vd = adminMode.trip.voyageurData || {}
    const myVd = vd[vid] || {}
    const items = (myVd[listKey] || []).map(i => i.id === itemId ? { ...i, qty } : i)
    await adminUpdateTripLocal({ voyageurData: { ...vd, [vid]: { ...myVd, [listKey]: items } } })
  }

  // Admin: switch active trip within the managed user's trips
  const adminSelectTrip = (tripId) => {
    if (!adminMode) return
    const t = adminMode.trips.find(tr => tr.id === tripId)
    if (t) setAdminMode(prev => ({ ...prev, trip: t }))
    setTab('planning')
  }

  // ALL hooks must be called before any conditional returns (React rules of hooks)
  const { tomorrow: tomorrowWeather } = useWeather(trip?.lat, trip?.lon)

  if (store.authLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'1rem', background:'#0f3460' }}>
        <div style={{ fontSize:'2rem' }}>☁️</div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.4rem', color:'#fff' }}>Séjours Vacances</div>
        <div style={{ fontSize:'.85rem', color:'rgba(255,255,255,.6)' }}>Connexion en cours…</div>
      </div>
    )
  }

  // Lien d'invitation partagé — APRÈS login Google
  if (shareCode && store.uid) {
    return (
      <JoinTripModal
        shareCode={shareCode}
        joinerUid={store.uid}
        joinerName={store.userDisplayName || ''}
        joinerEmail={store.userEmail || ''}
        onJoined={() => { setShareCode(null); window.history.replaceState({}, '', '/'); window.location.reload() }}
        onClose={() => { setShareCode(null); window.history.replaceState({}, '', '/') }}
      />
    )
  }

  // Lien d'invitation — pas encore connecté, forcer login
  if (shareCode && !store.uid) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg)', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '2rem', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🔗</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '.5rem' }}>Invitation à rejoindre un séjour</h2>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Connecte-toi avec Google pour rejoindre le séjour et accéder à toutes les fonctionnalités.</p>
          <button onClick={store.signIn} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: 12, fontSize: '.9rem' }}>
            🔐 Se connecter avec Google
          </button>
          <button onClick={() => { setShareCode(null); window.history.replaceState({}, '', '/') }} style={{ marginTop: '.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.78rem', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
            Annuler
          </button>
        </div>
      </div>
    )
  }

  if (!store.uid && !store.isGuest) {
    if (showInviteScreen) return <InviteScreen onBack={() => setShowInviteScreen(false)} onSuccess={store.signIn} />
    return <LoginScreen onGoogleSignIn={store.signIn} onCodeLogin={store.loginWithCode} onInviteLogin={() => setShowInviteScreen(true)} />
  }

  // TODO: vérification d'accès invité à réactiver quand le système sera stable

  if (!store.dataLoaded) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'1rem', background:'var(--bg)' }}>
        <div style={{ fontSize:'2rem' }}>☁️</div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.4rem', color:'var(--green)' }}>Séjours Vacances</div>
        <div style={{ fontSize:'.85rem', color:'var(--text-muted)' }}>Chargement de tes données…</div>
      </div>
    )
  }
  const tripVoyageurs = isAdminManaging ? (trip?.voyageurs || []) : store.tripVoyageurs
  // Guests only see their own voyageur in valise/sac tabs
  const visibleVoyageurs = store.isGuest
    ? tripVoyageurs.filter(v => v.id === vid)
    : tripVoyageurs

  const totalDays = destDays.length || 0
  const validatedDays = destDays.filter(d => d.validated).length || 0
  const pct = totalDays ? Math.round(validatedDays / totalDays * 100) : 0




  const handleAIResult = (activity, targetDayId) => {
    if (!trip) return
    const dayId = targetDayId || aiTargetDayId
    if (!dayId) return

    const targetDay = destDays.find(d => d.id === dayId)
    if (targetDay) {
      const duplicate = targetDay.activities.find(a =>
        a.title.toLowerCase().includes(activity.title.toLowerCase().slice(0, 10)) ||
        activity.title.toLowerCase().includes(a.title.toLowerCase().slice(0, 10))
      )
      if (duplicate) {
        if (!confirm(`"${duplicate.title}" est déjà prévu ce jour-là. Ajouter quand même ?`)) return
      }
    }

    // Toujours générer un id propre pour éviter les bugs d'édition
    doAddActivity(trip.id, dayId, { ...activity, id: genId('act'), notes: activity.notes || [], done: activity.done || false })
    setShowAI(false)
  }

  // Multi-dest day save helper
  const saveDestDays = (newDays) => {
    if (!trip) return
    if (isMultiDest) {
      const newDests = trip.destinations.map((d, i) => i === activeDestIdx ? { ...d, days: newDays } : d)
      if (isAdminManaging) adminUpdateTripLocal({ destinations: newDests })
      else store.updateTrip(trip.id, { destinations: newDests })
    }
  }

  const tripColor = destColor

  return (
    <div className="app-shell">
      {/* ── SIDEBAR (desktop) + MOBILE TOP BAR ── */}
      <Header
        trips={trips}
        activeTrip={trip}
        onSelectTrip={id => { if (isAdminManaging) adminSelectTrip(id); else { store.setActiveTrip(id); setTab('dashboard') } }}
        onNewTrip={() => setShowTripForm(true)}
        onEditTrip={t => setEditingTrip(t)}
        onDeleteTrip={id => store.deleteTrip(id)}
        voyageurs={tripVoyageurs}
        onOpenVoyageurs={() => setShowVoyageurs(true)}
        syncing={store.syncing}
        onOpenGlobalBudget={() => setTab('globalbudget')}
        userEmail={isAdminManaging ? `⚙️ Admin — ${adminMode.email}` : (store.isGuest ? `👤 ${store.guestSession?.voyageurName}` : (store.userDisplayName || store.userEmail))}
        onSignOut={store.signOut}
        isAdmin={store.isAdmin}
        onOpenAdmin={store.isAdmin ? () => setShowAdmin(true) : null}
        tab={tab}
        setTab={setTab}
      />

      {/* ── ZONE PRINCIPALE (décalée par sidebar desktop) ── */}
      <div className="app-main">

        {/* MOBILE BOTTOM NAV */}
        <BottomNav
          tab={tab} setTab={setTab}
          onOpenVoyageurs={() => setShowVoyageurs(true)}
          onOpenGlobalBudget={() => setTab('globalbudget')}
          onOpenAI={() => setTab('ai')}
          isAdmin={store.isAdmin}
          onOpenAdmin={store.isAdmin ? () => setShowAdmin(true) : null}
          onSignOut={store.signOut}
          userEmail={isAdminManaging ? `⚙️ Admin — ${adminMode.email}` : (store.isGuest ? `👤 ${store.guestSession?.voyageurName}` : (store.userDisplayName || store.userEmail))}
          trip={trip}
        />

        {/* ── HEADER PLEINE LARGEUR (titre + horloge + photo) — DESKTOP UNIQUEMENT ── */}
        <MainHeader trips={trips} activeTrip={trip} onSelectTrip={id => { if (isAdminManaging) adminSelectTrip(id); else { store.setActiveTrip(id); setTab('dashboard') } }} onEditTrip={t => setEditingTrip(t)} onDeleteTrip={id => store.deleteTrip(id)} onNewTrip={() => setShowTripForm(true)} onOpenVoyageurs={() => setShowVoyageurs(true)} onOpenGlobalBudget={() => setTab('globalbudget')} isAdmin={store.isAdmin} onOpenAdmin={store.isAdmin ? () => setShowAdmin(true) : null} onSignOut={store.signOut} userEmail={isAdminManaging ? `⚙️ Admin — ${adminMode.email}` : (store.isGuest ? `👤 ${store.guestSession?.voyageurName}` : (store.userDisplayName || store.userEmail))} syncing={store.syncing} tab={tab} onUpdatePhoto={(url) => trip && (isAdminManaging ? adminUpdateTripLocal({ headerPhoto: url }) : store.updateTrip(trip.id, { headerPhoto: url }))} />

        {/* ── BANDEAU SÉJOUR + DESTINATIONS + MÉTÉO ── */}
        {trip && tab !== 'admin' && (
          <div className="app-header-zone">
            <DangerAlert weather={tomorrowWeather} destination={destName || trip.name} />
            <div style={{ background: tripColor, color: '#fff', padding: '.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700 }}>
                  {trip.name}
                  {trip.subtitle && <span style={{ fontFamily: 'Inter', fontSize: '.85rem', fontWeight: 400, opacity: .85, marginLeft: '.5rem' }}>— {trip.subtitle}</span>}
                </div>
                {destAccommodation && <div style={{ fontSize: '.73rem', opacity: .8 }}>{destAccommodation}</div>}
              </div>
            </div>

            {/* Destination tabs (multi-destination only) */}
            {isMultiDest && (
              <div style={{ display: 'flex', gap: '.35rem', padding: '.5rem 1rem', overflowX: 'auto', scrollbarWidth: 'none', background: 'var(--card)' }}>
                {destinations.map((dest, idx) => (
                  <button key={dest.id} onClick={() => setActiveDestIdx(idx)} style={{
                    display: 'flex', alignItems: 'center', gap: '.4rem',
                    padding: '.4rem .85rem', borderRadius: 10,
                    border: `2px solid ${idx === activeDestIdx ? (dest.color || '#0F6E56') : 'var(--border)'}`,
                    background: idx === activeDestIdx ? (dest.color || '#0F6E56') : 'transparent',
                    color: idx === activeDestIdx ? '#fff' : 'var(--text)',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '.78rem', fontWeight: idx === activeDestIdx ? 600 : 400,
                    whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s'
                  }}>
                    <span style={{ fontSize: '.72rem' }}>{dest.name}</span>
                    <span style={{ fontSize: '.62rem', opacity: .7 }}>
                      {dest.startDate && new Date(dest.startDate+'T00:00:00').toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                      {dest.endDate && (' → ' + new Date(dest.endDate+'T00:00:00').toLocaleDateString('fr-FR', { day:'numeric', month:'short' }))}
                    </span>
                  </button>
                ))}
                <button onClick={() => setShowAddDest(true)} style={{
                  padding: '.4rem .7rem', borderRadius: 10, border: '2px dashed var(--border)',
                  background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.78rem',
                  color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0
                }}>＋ Étape</button>
              </div>
            )}

            <WeatherStrip lat={destLat} lon={destLon} locationName={destName || trip.name} />
          </div>
        )}

        {/* ── CONTENU selon onglet ── */}
        <div className="app-content">
          {/* BUDGET GLOBAL — inline */}
          {tab === 'globalbudget' && (
            <div className="content-pane">
              <GlobalBudget trips={trips} inline={true} onClose={() => setTab('dashboard')} />
            </div>
          )}

          {/* ADMIN BANNER when managing another user's trip */}
          {isAdminManaging && (
            <div style={{ background: 'linear-gradient(135deg, #2a1a3e, #1e2540)', color: '#fff', borderRadius: 12, padding: '.65rem 1rem', marginBottom: '.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.4rem' }}>
              <div>
                <div style={{ fontSize: '.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .7 }}>⚙️ Mode admin</div>
                <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{adminMode.trip.name} <span style={{ fontWeight: 400, opacity: .7, fontSize: '.78rem' }}>— {adminMode.email}</span></div>
              </div>
              <button onClick={() => { setAdminMode(null); setTab('admin') }} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 8, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontFamily: 'inherit' }}>
                ← Quitter
              </button>
            </div>
          )}

          {/* ADMIN — inline, avec header+sidebar visibles */}
          {tab === 'admin' && store.isAdmin && (
            <AdminPanel
              uid={store.uid}
              adminEmail={store.userEmail}
              onClose={() => setTab('dashboard')}
              onManageTrip={(user, t) => enterAdminMode(user, t)}
              inline={true}
            />
          )}


          {/* TABLEAU DE BORD / ACCUEIL */}
          {tab === 'dashboard' && (
            <Dashboard
              trips={trips}
              onSelectTrip={id => { if (isAdminManaging) adminSelectTrip(id); else { store.setActiveTrip(id); setTab('planning') } }}
              onCreateTrip={() => setShowTripForm(true)}
              userName={store.isGuest ? store.guestSession?.voyageurName : (store.userDisplayName?.split(' ')[0] || store.userEmail?.split('@')[0])}
              activeTrip={trip}
              tomorrowWeather={tomorrowWeather}
              onUpdateDay={(dayId, changes) => { if (!trip) return; if (isAdminManaging) adminUpdateTripLocal({ days: (isMultiDest ? trip.destinations[activeDestIdx]?.days : trip.days).map(d => d.id === dayId ? { ...d, ...changes } : d) }); else if (isMultiDest) { const nd = destDays.map(d => d.id === dayId ? { ...d, ...changes } : d); saveDestDays(nd) } else store.updateDay(trip.id, dayId, changes) }}
              onUpdateTrip={(tripId, changes) => isAdminManaging ? adminUpdateTripLocal(changes) : store.updateTrip(tripId, changes)}
              onScrollToDay={(dayId) => { setScrollToDayId(dayId); setTab('planning') }}
              setTab={setTab}
              uid={store.uid}
            />
          )}

        {/* PLANNING */}
        {tab === 'planning' && trip && (() => {
          // Scroll to target day after render
          if (scrollToDayId) {
            setTimeout(() => {
              const el = document.getElementById('day-' + scrollToDayId)
              if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.style.outline = '2px solid var(--green)'; el.style.borderRadius = '14px'; setTimeout(() => { el.style.outline = 'none' }, 2000) }
              setScrollToDayId(null)
            }, 100)
          }
          return (
          <div className="content-pane">
            <div className="progress-wrap">
              <div className="progress-bar"><div className="progress-bar-fill" style={{ width: pct + '%' }} /></div>
              <div className="progress-text">{validatedDays} / {totalDays} validées</div>
            </div>
            {destDays.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>
                Aucun jour dans ce séjour. Modifie le séjour pour définir les dates.
              </div>
            )}
            {destDays.map(day => (
              <div key={day.id} id={'day-' + day.id}>
              <DayCard
                day={day} tripId={trip.id} isToday={day.date === today}
                onValidateDay={() => doValidateDay(trip.id, day.id)}
                onDeleteDay={() => { if (isMultiDest) { saveDestDays(destDays.filter(d => d.id !== day.id)) } else store.deleteDay(trip.id, day.id) }}
                onAddActivity={(dayId, act) => doAddActivity(trip.id, dayId, act)}
                onUpdateActivity={(dayId, actId, ch) => doUpdateActivity(trip.id, dayId, actId, ch)}
                onDeleteActivity={(dayId, actId) => doDeleteActivity(trip.id, dayId, actId)}
                onMoveActivity={(dayId, actId, date) => { if (!isMultiDest) store.moveActivity(trip.id, dayId, actId, date) }}
                onReorderActivities={(dayId, from, to) => { if (isMultiDest) { const nd = destDays.map(d => { if (d.id !== dayId) return d; const acts = [...(d.activities||[])]; const [m] = acts.splice(from,1); acts.splice(to,0,m); return {...d,activities:acts} }); saveDestDays(nd) } else store.reorderActivities(trip.id, dayId, from, to) }}
                onValidateActivity={(dayId, actId) => doValidateActivity(trip.id, dayId, actId)}
                onAISearch={(dayId) => { setAiTargetDayId(dayId); setShowAI(true) }}
              />
              </div>
            ))}
          </div>
          )
        })()}

        {/* INFOS */}
        {tab === 'infos' && (
          <div className="content-pane">
            <InfosTab trip={{...trip, destination: destName, accommodation: destAccommodation, lat: destLat, lon: destLon, days: destDays, ownerUid: isAdminManaging ? adminMode.uid : store.uid}} onUpdateTrip={(changes) => isAdminManaging ? adminUpdateTripLocal(changes) : store.updateTrip(trip.id, changes)} />
          </div>
        )}

        {/* BUDGET */}
        {tab === 'budget' && trip && (
          <div className="content-pane">
            <Budget trip={trip} voyageurs={trip?.voyageurs || []} isGuest={store.isGuest} activeVoyageurId={vid} onUpdate={(changes) => isAdminManaging ? adminUpdateTripLocal(changes) : store.updateTrip(trip.id, changes)} />
          </div>
        )}

        {/* VALISE */}
        {tab === 'valise' && (
          <div className="content-pane">
            <div className="col-head"><h2>🧳 Valise</h2></div>
            {visibleVoyageurs.length > 1 && (
              <div className="tabs" style={{ marginBottom: '.5rem' }}>
                {visibleVoyageurs.map(v => (
                  <button key={v.id} className={`tab-btn${v.id === vid ? ' active' : ''}`} onClick={() => isAdminManaging ? setAdminVid(v.id) : store.setActiveVoyageur(trip.id, v.id)}>{v.name}</button>
                ))}
              </div>
            )}
            <CheckList items={isAdminManaging ? adminValise : store.currentValise} onToggle={id => isAdminManaging ? adminToggleItem("valise", id) : store.toggleValiseItem(trip?.id, vid, id)} onAdd={text => isAdminManaging ? adminAddItem("valise", text) : store.addValiseItem(trip?.id, vid, text)} onRemove={id => isAdminManaging ? adminRemoveItem("valise", id) : store.removeValiseItem(trip?.id, vid, id)} onUpdateQty={(id, qty) => isAdminManaging ? adminUpdateItemQty("valise", id, qty) : store.updateValiseItemQty(trip?.id, vid, id, qty)} emptyEmoji="🧳" />
          </div>
        )}

        {/* SAC À DOS */}
        {tab === 'sac' && (
          <div className="content-pane">
            <div className="col-head"><h2>🎒 Sac à dos</h2></div>
            {visibleVoyageurs.length > 1 && (
              <div className="tabs" style={{ marginBottom: '.5rem' }}>
                {visibleVoyageurs.map(v => (
                  <button key={v.id} className={`tab-btn${v.id === vid ? ' active' : ''}`} onClick={() => isAdminManaging ? setAdminVid(v.id) : store.setActiveVoyageur(trip.id, v.id)}>{v.name}</button>
                ))}
              </div>
            )}
            <CheckList items={isAdminManaging ? adminSac : store.currentSac} onToggle={id => isAdminManaging ? adminToggleItem("sac", id) : store.toggleSacItem(trip?.id, vid, id)} onAdd={text => isAdminManaging ? adminAddItem("sac", text) : store.addSacItem(trip?.id, vid, text)} onRemove={id => isAdminManaging ? adminRemoveItem("sac", id) : store.removeSacItem(trip?.id, vid, id)} onUpdateQty={(id, qty) => isAdminManaging ? adminUpdateItemQty("sac", id, qty) : store.updateSacItemQty(trip?.id, vid, id, qty)} emptyEmoji="🎒" />
          </div>
        )}

        {/* IA RANDOS */}
        {tab === 'ai' && trip && (
          <div className="content-pane">
            <AIRandoSearch
              trip={trip} destination={destName || trip.name} days={destDays}
              targetDayId={null}
              onSelectActivity={(activity, targetDayId) => { store.addActivity(trip.id, targetDayId, { ...activity, id: genId('act'), notes: activity.notes || [], done: activity.done || false }); setTab('planning') }}
              onClose={() => setTab('planning')}
              inline={true}
            />
          </div>
        )}
      </div>

      {/* MODALS */}
      {(showTripForm || editingTrip) && (
        <TripForm
          initial={editingTrip}
          onSave={tripData => {
            if (editingTrip) store.updateTrip(editingTrip.id, tripData)
            else store.addTrip(tripData)
            setShowTripForm(false); setEditingTrip(null)
          }}
          onClose={() => { setShowTripForm(false); setEditingTrip(null) }}
        />
      )}



      {/* ── ADD DESTINATION MODAL ── */}
      {showAddDest && trip && (() => {
        const DEST_COLORS = ['#0F6E56','#185FA5','#A32D2D','#BA7517','#7C3AED','#0891B2','#BE185D','#065F46']
        const usedColors = (trip.destinations || []).map(d => d.color)
        const nextColor = DEST_COLORS.find(c => !usedColors.includes(c)) || DEST_COLORS[0]
        return (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddDest(false)}>
            <div className="modal" style={{ maxWidth: 460 }}>
              <h2>📍 Ajouter une étape</h2>
              <form onSubmit={e => {
                e.preventDefault()
                const fd = new FormData(e.target)
                const name = fd.get('destName')?.trim()
                const startDate = fd.get('startDate')
                const endDate = fd.get('endDate')
                if (!name || !startDate || !endDate) return alert('Destination, dates requises')
                if (endDate < startDate) return alert('Date de fin avant date de début')

                const days = []
                const s = new Date(startDate + 'T00:00:00'), en = new Date(endDate + 'T00:00:00')
                for (let d = new Date(s); d <= en; d.setDate(d.getDate() + 1)) {
                  const iso = d.toISOString().slice(0, 10)
                  days.push({ id: 'day_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), date: iso, label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }), activities: [], validated: false })
                }

                const newDest = { id: 'dest_' + Date.now(), name, startDate, endDate, color: fd.get('color') || nextColor, accommodation: fd.get('accommodation') || '', accommodationPhone: '', lat: null, lon: null, headerPhoto: null, days }

                // Convert to multi-dest if needed
                if (!isMultiDest) {
                  const firstDest = { id: 'dest_original', name: trip.destination || trip.name, startDate: trip.startDate, endDate: trip.endDate, color: trip.color, lat: trip.lat, lon: trip.lon, headerPhoto: trip.headerPhoto, accommodation: trip.accommodation, accommodationPhone: trip.accommodationPhone, days: trip.days || [] }
                  const update = { destinations: [firstDest, newDest] }
                  if (isAdminManaging) adminUpdateTripLocal(update)
                  else store.updateTrip(trip.id, update)
                } else {
                  const update = { destinations: [...(trip.destinations || []), newDest] }
                  if (isAdminManaging) adminUpdateTripLocal(update)
                  else store.updateTrip(trip.id, update)
                }
                setActiveDestIdx(isMultiDest ? trip.destinations.length : 1)
                setShowAddDest(false)
              }}>
                <div className="form-group"><label>Destination *</label><input name="destName" placeholder="ex: Grenoble, Annecy…" required autoFocus /></div>
                <div className="form-row">
                  <div className="form-group"><label>Début *</label><input name="startDate" type="date" required /></div>
                  <div className="form-group"><label>Fin *</label><input name="endDate" type="date" required /></div>
                </div>
                <div className="form-group"><label>Hébergement</label><input name="accommodation" placeholder="Adresse ou nom" /></div>
                <div className="form-group"><label>Couleur</label>
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                    {DEST_COLORS.map(c => (
                      <label key={c} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: '3px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <input type="radio" name="color" value={c} defaultChecked={c === nextColor} style={{ display: 'none' }} />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn" onClick={() => setShowAddDest(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">＋ Ajouter l'étape</button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {showVoyageurs && trip && (
        <VoyageursModal
          trip={trip}
          voyageurs={tripVoyageurs}
          onAdd={(name, email) => {
            if (isAdminManaging) { adminUpdateTripLocal({ voyageurs: [...(trip.voyageurs||[]), { id: 'v_'+Date.now(), name, email }] }) }
            else store.addVoyageur(trip.id, name, email)
          }}
          onRemove={vId => {
            if (isAdminManaging) { adminUpdateTripLocal({ voyageurs: (trip.voyageurs||[]).filter(v => v.id !== vId) }) }
            else store.removeVoyageur(trip.id, vId)
          }}
          onUpdateEmail={(vId, email) => {
            if (isAdminManaging) { adminUpdateTripLocal({ voyageurs: (trip.voyageurs||[]).map(v => v.id === vId ? { ...v, email } : v) }) }
            else store.updateVoyageurEmail(trip.id, vId, email)
          }}
          onClose={() => setShowVoyageurs(false)}
        />
      )}

      {showAdmin && store.isAdmin && (
        <AdminPanel
          uid={store.uid}
          adminEmail={store.userEmail}
          onClose={() => setShowAdmin(false)}
          onManageTrip={(user, trip) => enterAdminMode(user, trip)}
        />
      )}

      {showAI && trip && (
        <AIRandoSearch
          trip={trip}
          destination={destName || trip.name}
          days={destDays}
          targetDayId={aiTargetDayId}
          onSelectActivity={handleAIResult}
          onClose={() => setShowAI(false)}
        />
      )}
      </div>{/* end app-main */}
    </div>
  )
}

import { useState } from 'react'
import { useStore } from './hooks/useStore'
import { getTodayStr, genId, formatDate, displayToISO } from './utils'
import Header from './components/Header'
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

function LoginScreen({ onGoogleSignIn, onCodeLogin }) {
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
      <div style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(1.4rem, 5vw, 2rem)', fontWeight:700, color:'#fff', textAlign:'center' }}>Vacances Aharone</div>
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
  const [tab, setTab] = useState('planning')
  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [showVoyageurs, setShowVoyageurs] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showGlobalBudget, setShowGlobalBudget] = useState(false)
  const [aiTargetDayId, setAiTargetDayId] = useState(null)

  const trip = store.activeTrip
  const today = getTodayStr()
  const vid = store.activeVoyageurId

  // ALL hooks must be called before any conditional returns (React rules of hooks)
  const { tomorrow: tomorrowWeather } = useWeather(trip?.lat, trip?.lon)

  if (store.authLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'1rem', background:'#0f3460' }}>
        <div style={{ fontSize:'2rem' }}>☁️</div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.4rem', color:'#fff' }}>Vacances Aharone</div>
        <div style={{ fontSize:'.85rem', color:'rgba(255,255,255,.6)' }}>Connexion en cours…</div>
      </div>
    )
  }

  if (!store.uid && !store.isGuest) {
    return <LoginScreen onGoogleSignIn={store.signIn} onCodeLogin={store.loginWithCode} />
  }

  if (!store.dataLoaded) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'1rem', background:'var(--bg)' }}>
        <div style={{ fontSize:'2rem' }}>☁️</div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.4rem', color:'var(--green)' }}>Vacances Aharone</div>
        <div style={{ fontSize:'.85rem', color:'var(--text-muted)' }}>Chargement de tes données…</div>
      </div>
    )
  }
  const tripVoyageurs = store.tripVoyageurs
  // Guests only see their own voyageur in valise/sac tabs
  const visibleVoyageurs = store.isGuest
    ? tripVoyageurs.filter(v => v.id === store.activeVoyageurId)
    : tripVoyageurs

  const totalDays = trip?.days.length || 0
  const validatedDays = trip?.days.filter(d => d.validated).length || 0
  const pct = totalDays ? Math.round(validatedDays / totalDays * 100) : 0




  const handleAIResult = (activity, targetDayId) => {
    if (!trip) return
    const dayId = targetDayId || aiTargetDayId
    if (!dayId) return // shouldn't happen - AIRandoSearch handles day selection

    // Check if similar activity already exists on that day
    const targetDay = trip.days.find(d => d.id === dayId)
    if (targetDay) {
      const duplicate = targetDay.activities.find(a =>
        a.title.toLowerCase().includes(activity.title.toLowerCase().slice(0, 10)) ||
        activity.title.toLowerCase().includes(a.title.toLowerCase().slice(0, 10))
      )
      if (duplicate) {
        if (!confirm(`"${duplicate.title}" est déjà prévu ce jour-là. Ajouter quand même ?`)) return
      }
    }

    store.addActivity(trip.id, dayId, { ...activity, id: genId('act') })
    setShowAI(false)
  }

  const tripColor = trip?.color || '#0F6E56'

  return (
    <div>
      {/* GLOBAL HEADER */}
      <Header
        trips={store.trips}
        activeTrip={trip}
        onSelectTrip={id => { store.setActiveTrip(id); setTab('planning') }}
        onNewTrip={() => setShowTripForm(true)}
        onEditTrip={t => setEditingTrip(t)}
        onDeleteTrip={id => store.deleteTrip(id)}
        voyageurs={tripVoyageurs}
        onOpenVoyageurs={() => setShowVoyageurs(true)}
        syncing={store.syncing}
        onOpenGlobalBudget={!store.isGuest || store.trips?.length > 1 ? () => setShowGlobalBudget(true) : null}
        userEmail={store.isGuest ? `👤 ${store.guestSession?.voyageurName}` : store.userEmail}
        onSignOut={store.signOut}
      />

      {/* DANGER ALERT — shown on load if extreme conditions */}
      {trip && <DangerAlert weather={tomorrowWeather} destination={trip.destination || trip.name} />}

      {/* TRIP-SPECIFIC SECTION */}
      {trip && (
        <>
          {/* Trip color bar with name */}
          <div style={{ background: tripColor, color: '#fff', padding: '.6rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700 }}>
                {trip.name}
                {trip.subtitle && <span style={{ fontFamily: 'Inter', fontSize: '.85rem', fontWeight: 400, opacity: .85, marginLeft: '.5rem' }}>— {trip.subtitle}</span>}
              </div>
              {trip.accommodation && <div style={{ fontSize: '.73rem', opacity: .8 }}>{trip.accommodation}</div>}
            </div>

          </div>

          <WeatherStrip lat={trip.lat} lon={trip.lon} locationName={trip.destination || trip.name} />
          <div className="warn-strip">⚠️ Règle d'or : partir avant 9h · rentrer avant 14h si ciel se couvre · orages 14h–18h</div>
          <TodayZone trip={trip} tomorrowWeather={tomorrowWeather} onUpdateDay={(dayId, changes) => store.updateDay(trip.id, dayId, changes)} />
        </>
      )}

      {/* MAIN 3-COL LAYOUT */}
      <div className="app-layout">

        {/* LEFT: SAC À DOS */}
        <div className="col-side">
          <div className="col-head"><h2>🎒 Sac à dos</h2></div>
          {visibleVoyageurs.length > 1 && (
            <div className="tabs" style={{ marginBottom: '.5rem' }}>
              {visibleVoyageurs.map(v => (
                <button key={v.id} className={`tab-btn${v.id === vid ? ' active' : ''}`}
                  onClick={() => store.setActiveVoyageur(trip.id, v.id)}>{v.name}</button>
              ))}
            </div>
          )}
          <CheckList
            items={store.currentSac}
            onToggle={id => store.toggleSacItem(trip?.id, vid, id)}
            onAdd={text => store.addSacItem(trip?.id, vid, text)}
            onRemove={id => store.removeSacItem(trip?.id, vid, id)}
            onUpdateQty={(id, qty) => store.updateSacItemQty(trip?.id, vid, id, qty)}
            emptyEmoji="🎒"
          />
        </div>

        {/* CENTER: PLANNING / INFOS */}
        <div className="col-center">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
            <div className="tabs" style={{ flex: 1, marginBottom: 0 }}>
              <button className={`tab-btn${tab === 'planning' ? ' active' : ''}`} onClick={() => setTab('planning')}>📋 Planning</button>
              <button className={`tab-btn${tab === 'infos' ? ' active' : ''}`} onClick={() => setTab('infos')}>ℹ️ Infos</button>
              <button className={`tab-btn${tab === 'budget' ? ' active' : ''}`} onClick={() => setTab('budget')}>💰 Budget</button>
            </div>
            {/* AI Button */}
            <button className="btn btn-primary" style={{ whiteSpace: 'nowrap', fontSize: '.75rem' }}
              onClick={() => { setAiTargetDayId(null); setShowAI(true) }}>
              🤖 IA Randos
            </button>
          </div>

          {tab === 'planning' && trip && (
            <>
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: pct + '%' }} />
                </div>
                <div className="progress-text">{validatedDays} / {totalDays} validées</div>
              </div>

              {trip.days.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>
              Aucun jour dans ce séjour. Modifie le séjour pour définir les dates.
            </div>
          )}
          {trip.days.map(day => (
                <DayCard
                  key={day.id}
                  day={day}
                  tripId={trip.id}
                  isToday={day.date === today}
                  onValidateDay={() => store.validateDay(trip.id, day.id)}
                  onDeleteDay={() => store.deleteDay(trip.id, day.id)}
                  onAddActivity={(dayId, act) => store.addActivity(trip.id, dayId, act)}
                  onUpdateActivity={(dayId, actId, ch) => store.updateActivity(trip.id, dayId, actId, ch)}
                  onDeleteActivity={(dayId, actId) => store.deleteActivity(trip.id, dayId, actId)}
                  onMoveActivity={(dayId, actId, date) => store.moveActivity(trip.id, dayId, actId, date)}
                  onValidateActivity={(dayId, actId) => store.validateActivity(trip.id, dayId, actId)}
                  onAISearch={(dayId) => { setAiTargetDayId(dayId); setShowAI(true) }}
                />
              ))}


            </>
          )}

          {tab === 'infos' && <InfosTab trip={trip} onUpdateTrip={(changes) => store.updateTrip(trip.id, changes)} />}
          {tab === 'budget' && trip && (
            <Budget
              trip={trip}
              voyageurs={store.tripVoyageurs}
              isGuest={store.isGuest}
              guestVoyageurId={store.activeVoyageurId}
              onUpdate={(changes) => store.updateTrip(trip.id, changes)}
            />
          )}
        </div>

        {/* RIGHT: VALISE */}
        <div className="col-side">
          <div className="col-head"><h2>🧳 Valise</h2></div>
          {visibleVoyageurs.length > 1 && (
            <div className="tabs" style={{ marginBottom: '.5rem' }}>
              {visibleVoyageurs.map(v => (
                <button key={v.id} className={`tab-btn${v.id === vid ? ' active' : ''}`}
                  onClick={() => store.setActiveVoyageur(trip.id, v.id)}>{v.name}</button>
              ))}
            </div>
          )}
          <CheckList
            items={store.currentValise}
            onToggle={id => store.toggleValiseItem(trip?.id, vid, id)}
            onAdd={text => store.addValiseItem(trip?.id, vid, text)}
            onRemove={id => store.removeValiseItem(trip?.id, vid, id)}
            onUpdateQty={(id, qty) => store.updateValiseItemQty(trip?.id, vid, id, qty)}
            emptyEmoji="🧳"
          />
        </div>
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

      {showGlobalBudget && (
        <GlobalBudget
          trips={store.trips}
          onClose={() => setShowGlobalBudget(false)}
        />
      )}

      {showVoyageurs && trip && (
        <VoyageursModal
          trip={trip}
          voyageurs={tripVoyageurs}
          onAdd={(name, email) => store.addVoyageur(trip.id, name, email)}
          onRemove={vid => store.removeVoyageur(trip.id, vid)}
          onUpdateEmail={(vid, email) => store.updateVoyageurEmail(trip.id, vid, email)}
          onClose={() => setShowVoyageurs(false)}
        />
      )}

      {showAI && trip && (
        <AIRandoSearch
          destination={trip.destination || trip.name}
          days={trip.days}
          targetDayId={aiTargetDayId}
          onSelectActivity={handleAIResult}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  )
}

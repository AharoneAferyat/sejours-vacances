import { useState } from 'react'
import { useStore } from './hooks/useStore'
import { getTodayStr, genId, formatDate, displayToISO, calcDayStats, formatDuration } from './utils'
import Header from './components/Header'
import WeatherStrip from './components/WeatherStrip'
import TodayZone from './components/TodayZone'
import DayCard from './components/DayCard'
import CheckList from './components/CheckList'
import TripForm from './components/TripForm'
import VoyageursModal from './components/VoyageursModal'
import InfosTab from './components/InfosTab'
import AIRandoSearch from './components/AIRandoSearch'

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState('planning')
  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [showVoyageurs, setShowVoyageurs] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiTargetDayId, setAiTargetDayId] = useState(null)

  const trip = store.activeTrip
  const today = getTodayStr()
  const vid = store.activeVoyageurId
  const tripVoyageurs = store.tripVoyageurs

  const totalDays = trip?.days.length || 0
  const validatedDays = trip?.days.filter(d => d.validated).length || 0
  const pct = totalDays ? Math.round(validatedDays / totalDays * 100) : 0

  // Global trip stats
  const tripStats = trip ? (() => {
    const allActs = trip.days.flatMap(d => d.activities)
    const stats = calcDayStats(allActs)
    return stats
  })() : null



  const handleAIResult = (activity) => {
    if (!trip) return
    if (aiTargetDayId) {
      store.addActivity(trip.id, aiTargetDayId, { ...activity, id: genId('act') })
    } else {
      // Add to first available day or ask
      const firstDay = trip.days[0]
      if (firstDay) store.addActivity(trip.id, firstDay.id, { ...activity, id: genId('act') })
    }
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
      />

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
            {/* Trip total stats */}
            {tripStats && (tripStats.totalKm > 0 || tripStats.totalMin > 0) && (
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0, opacity: .85, fontSize: '.75rem' }}>
                {tripStats.totalKm > 0 && <span style={{ background: 'rgba(255,255,255,.2)', padding: '3px 9px', borderRadius: 20 }}>📍 {tripStats.totalKm}km total</span>}
                {tripStats.totalDplus > 0 && <span style={{ background: 'rgba(255,255,255,.2)', padding: '3px 9px', borderRadius: 20 }}>⬆️ {tripStats.totalDplus}m D+</span>}
                {tripStats.totalMin > 0 && <span style={{ background: 'rgba(255,255,255,.2)', padding: '3px 9px', borderRadius: 20 }}>⏱ {formatDuration(tripStats.totalMin)}</span>}
              </div>
            )}
          </div>

          <WeatherStrip lat={trip.lat} lon={trip.lon} locationName={trip.destination || trip.name} />
          <div className="warn-strip">⚠️ Règle d'or : partir avant 9h · rentrer avant 14h si ciel se couvre · orages 14h–18h</div>
          <TodayZone trip={trip} onUpdateDay={(dayId, changes) => store.updateDay(trip.id, dayId, changes)} />
        </>
      )}

      {/* MAIN 3-COL LAYOUT */}
      <div className="app-layout">

        {/* LEFT: VALISE */}
        <div className="col-side">
          <div className="col-head"><h2>🧳 Valise</h2></div>
          {tripVoyageurs.length > 1 && (
            <div className="tabs" style={{ marginBottom: '.5rem' }}>
              {tripVoyageurs.map(v => (
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
            emptyEmoji="🧳"
          />
        </div>

        {/* CENTER: PLANNING / INFOS */}
        <div className="col-center">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
            <div className="tabs" style={{ flex: 1, marginBottom: 0 }}>
              <button className={`tab-btn${tab === 'planning' ? ' active' : ''}`} onClick={() => setTab('planning')}>📋 Planning</button>
              <button className={`tab-btn${tab === 'infos' ? ' active' : ''}`} onClick={() => setTab('infos')}>ℹ️ Infos</button>
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

          {tab === 'infos' && <InfosTab trip={trip} />}
        </div>

        {/* RIGHT: SAC À DOS */}
        <div className="col-side">
          <div className="col-head"><h2>🎒 Sac à dos</h2></div>
          {tripVoyageurs.length > 1 && (
            <div className="tabs" style={{ marginBottom: '.5rem' }}>
              {tripVoyageurs.map(v => (
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
            emptyEmoji="🎒"
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

      {showVoyageurs && trip && (
        <VoyageursModal
          tripName={trip.name}
          voyageurs={tripVoyageurs}
          onAdd={name => store.addVoyageur(trip.id, name)}
          onRemove={vid => store.removeVoyageur(trip.id, vid)}
          onClose={() => setShowVoyageurs(false)}
        />
      )}

      {showAI && trip && (
        <AIRandoSearch
          destination={trip.destination || trip.name}
          onSelectActivity={handleAIResult}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  )
}

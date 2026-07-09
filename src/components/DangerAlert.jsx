import { useState } from 'react'

const DANGER_WEATHER_CODES = [95, 96, 99]
const HIGH_WIND = 50

function checkWeatherDanger(weather) {
  if (!weather) return null
  const alerts = []
  const hasStorm = weather.hours?.some(h => DANGER_WEATHER_CODES.includes(h.wc))
  if (hasStorm) alerts.push('⛈ Risque d\'orages avec grêle détecté dans les prévisions')
  if (weather.wind > HIGH_WIND) alerts.push(`💨 Vents forts prévus (${weather.wind} km/h)`)
  return alerts.length > 0 ? alerts : null
}

export default function DangerAlert({ weather, destination }) {
  const [dismissed, setDismissed] = useState(false)
  const weatherAlerts = checkWeatherDanger(weather)
  if (dismissed || !weatherAlerts?.length) return null

  return (
    <div style={{
      background: '#fef8e6', border: '1px solid #e8c547',
      borderRadius: 10, padding: '.6rem .9rem', marginBottom: '.4rem',
      display: 'flex', alignItems: 'flex-start', gap: '.5rem'
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#7a5d0a', marginBottom: '.2rem' }}>
          Conditions météo à surveiller — {destination}
        </div>
        {weatherAlerts.map((a, i) => (
          <div key={i} style={{ fontSize: '.75rem', color: '#8f6e20', lineHeight: 1.5 }}>{a}</div>
        ))}
        <div style={{ fontSize: '.65rem', color: '#a08530', marginTop: '.3rem', fontStyle: 'italic' }}>
          Source : prévisions Open-Meteo · Consultez <a href="https://vigilance.meteofrance.fr" target="_blank" rel="noreferrer" style={{ color: '#7a5d0a', fontWeight: 600 }}>Météo France Vigilance</a> pour les alertes officielles.
        </div>
      </div>
      <button onClick={() => setDismissed(true)} style={{
        background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem',
        color: '#a08530', flexShrink: 0, padding: '2px'
      }}>✕</button>
    </div>
  )
}

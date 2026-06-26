import { useState, useEffect } from 'react'

const DANGER_WEATHER_CODES = [95, 96, 99] // thunderstorm with hail
const EXTREME_WIND = 60 // km/h

function checkWeatherDanger(weather) {
  if (!weather) return null
  const alerts = []
  
  const hasExtremStorm = weather.hours?.some(h => DANGER_WEATHER_CODES.includes(h.wc))
  if (hasExtremStorm) {
    alerts.push('⛈ Orages violents avec grêle prévus — évitez les sommets et zones exposées')
  }
  if (weather.wind > EXTREME_WIND) {
    alerts.push(`💨 Vents extrêmes (${weather.wind} km/h) — danger en altitude, ne pas randonner`)
  }
  
  return alerts.length > 0 ? alerts : null
}

export default function DangerAlert({ weather, destination }) {
  const [dismissed, setDismissed] = useState(false)
  const [newsAlert, setNewsAlert] = useState(null)

  // Check weather dangers
  const weatherAlerts = checkWeatherDanger(weather)

  // Could add news API here in future
  // For now just weather-based

  const allAlerts = [...(weatherAlerts || []), ...(newsAlert ? [newsAlert] : [])]

  if (dismissed || allAlerts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,.65)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.4)'
      }}>
        {/* Red header */}
        <div style={{ background: '#dc2626', color: '#fff', padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '.25rem' }}>⚠️ Alerte sécurité</div>
          <div style={{ fontSize: '.85rem', opacity: .9 }}>
            Danger identifié pour {destination}
          </div>
        </div>

        {/* Alerts list */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {allAlerts.map((alert, i) => (
            <div key={i} style={{
              background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: 10, padding: '.85rem 1rem',
              marginBottom: i < allAlerts.length - 1 ? '.5rem' : 0,
              fontSize: '.88rem', lineHeight: 1.6, color: '#991b1b'
            }}>
              {alert}
            </div>
          ))}

          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.85rem', lineHeight: 1.6 }}>
            Consultez les autorités locales et la météo officielle avant toute activité en extérieur.
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '.75rem 1.5rem 1.25rem', display: 'flex', gap: '.5rem' }}>
          <a href="https://vigilance.meteofrance.fr" target="_blank" rel="noreferrer"
            style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: '.85rem', fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Voir Météo France
          </a>
          <button onClick={() => setDismissed(true)}
            style={{ flex: 1, background: 'var(--gray-light)', color: 'var(--text)', border: 'none', borderRadius: 10, padding: '10px', fontSize: '.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Compris, ignorer
          </button>
        </div>
      </div>
    </div>
  )
}

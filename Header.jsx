import { useWeather } from '../hooks/useWeather'

const WC_ICON = { 0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',51:'🌦',61:'🌧',63:'🌧',80:'🌦',81:'🌧',95:'⛈',96:'⛈' }

export default function WeatherStrip({ lat, lon, locationName }) {
  const { weather, loading } = useWeather(lat, lon)

  if (!lat || !lon) {
    return (
      <div className="weather-strip">
        📍 Pas de coordonnées — ajoutez une adresse dans les infos du séjour
      </div>
    )
  }

  if (loading) return <div className="weather-strip">🌤 Chargement météo {locationName ? `(${locationName})` : ''}…</div>

  if (!weather) return (
    <div className="weather-strip">
      🌤 Météo indisponible —{' '}
      <a href="https://meteo.fr" target="_blank" rel="noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>meteo.fr →</a>
    </div>
  )

  return (
    <div className={`weather-strip${weather.hasStorm ? ' storm' : ''}`}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem', flexWrap: 'wrap' }}>
          <span>
            {weather.icon} {locationName && <strong>{locationName} : </strong>}
            <strong>{weather.temp}°C</strong> · {weather.label} · Vent {weather.wind} km/h
            {weather.hasStorm && <strong style={{ marginLeft: '.5rem', color: '#b45309' }}>⚠️ Orages prévus</strong>}
          </span>
        </div>
        <div className="hourly-scroll">
          {weather.hours.map((h, i) => (
            <div key={i} className={`hour-cell${h.isNow ? ' now' : ''}`}>
              <div style={{ fontSize: '.63rem', opacity: .7, marginBottom: 2 }}>{h.h}h</div>
              <div style={{ fontSize: '.95rem' }}>{WC_ICON[h.wc] || '🌡'}</div>
              <div style={{ fontSize: '.73rem', fontWeight: 600, marginTop: 2 }}>{h.temp}°</div>
              {h.rain > 20 && <div style={{ fontSize: '.6rem', opacity: .65 }}>{h.rain}%💧</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

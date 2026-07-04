import { useWeather } from '../hooks/useWeather'

const WC_ICON = { 0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',51:'🌦',61:'🌧',63:'🌧',80:'🌦',81:'🌧',95:'⛈',96:'⛈' }

function uvLabel(uv) {
  if (uv <= 2) return 'faible'
  if (uv <= 5) return 'modéré'
  if (uv <= 7) return 'élevé'
  if (uv <= 10) return 'très élevé'
  return 'extrême'
}

function TempCurve({ hours }) {
  if (!hours || hours.length < 3) return null
  const displayHours = hours.filter(h => h.h >= 6 && h.h <= 22)
  if (displayHours.length < 3) return null

  const temps = displayHours.map(h => h.temp)
  const min = Math.min(...temps) - 1
  const max = Math.max(...temps) + 1
  const range = max - min || 1
  const w = 600, h = 80, px = 30, py = 10

  const points = displayHours.map((hr, i) => ({
    x: px + (i / (displayHours.length - 1)) * (w - 2 * px),
    y: py + (1 - (hr.temp - min) / range) * (h - 2 * py),
    temp: hr.temp
  }))

  // Smooth curve
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const cx = (points[i].x + points[i + 1].x) / 2
    path += ` C ${cx} ${points[i].y}, ${cx} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`
  }

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: '100%', height: 'auto', marginTop: 8 }}>
      <defs>
        <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green)" stopOpacity=".25" />
          <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill */}
      <path d={`${path} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`} fill="url(#curveGrad)" />
      {/* Line */}
      <path d={path} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="var(--green)" stroke="#fff" strokeWidth="2" />
          <text x={p.x} y={p.y + 16} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontFamily="Inter, sans-serif">{p.temp}°</text>
        </g>
      ))}
    </svg>
  )
}

export default function WeatherStrip({ lat, lon, locationName }) {
  const { weather, loading } = useWeather(lat, lon)

  if (!lat || !lon) return <div className="weather-strip">📍 Localisez le séjour pour voir la météo</div>
  if (loading) return <div className="weather-strip">🌤 Chargement météo…</div>
  if (!weather) return (
    <div className="weather-strip">
      🌤 Météo indisponible — <a href="https://meteo.fr" target="_blank" rel="noreferrer" style={{ color:'inherit', fontWeight:600 }}>meteo.fr →</a>
    </div>
  )

  const displayHours = weather.hours.filter(h => h.h >= 6 && h.h <= 22)

  return (
    <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>

      {/* ── Main weather card ── */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Big icon + temp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>{weather.icon}</div>
            <div>
              <div style={{ fontSize: '2.8rem', fontWeight: 700, lineHeight: 1 }}>{weather.temp}°</div>
              <div style={{ fontSize: '.88rem', color: 'var(--text)', marginTop: 2 }}>{weather.label}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>Ressenti {weather.feelsLike}°</div>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '.82rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            <span>💨 Vent {weather.wind} km/h</span>
            <span>💧 {weather.rainProb}% pluie</span>
            <span style={{ color: 'var(--red)' }}>↑ {weather.tempMax}° max</span>
            <span style={{ color: 'var(--blue)' }}>↓ {weather.tempMin}° min</span>
            <span>☀️ UV {weather.uvMax} ({uvLabel(weather.uvMax)})</span>
          </div>
        </div>
      </div>

      {/* ── Hourly forecast ── */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {displayHours.map((h, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minWidth: 64, padding: '8px 6px',
              borderRadius: 12,
              border: h.isNow ? '2px solid var(--green)' : '2px solid transparent',
              background: h.isNow ? 'var(--green-light)' : 'transparent',
              transition: 'all .15s'
            }}>
              <div style={{ fontSize: '.72rem', fontWeight: h.isNow ? 700 : 400, color: h.isNow ? 'var(--green)' : 'var(--text-muted)' }}>
                {h.isNow ? 'Maintenant' : h.h + 'h'}
              </div>
              <div style={{ fontSize: '1.3rem' }}>{WC_ICON[h.wc] || '🌡'}</div>
              <div style={{ fontSize: '.88rem', fontWeight: 600 }}>{h.temp}°</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Temperature curve ── */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1.25rem 1rem' }}>
        <TempCurve hours={weather.hours} />
      </div>

      {/* Storm warning */}
      {weather.hasStorm && (
        <div style={{ background: 'var(--amber-light)', color: 'var(--amber)', padding: '.6rem 1.25rem', fontSize: '.8rem', fontWeight: 600, borderTop: '1px solid rgba(143,78,32,.15)' }}>
          ⚠️ Orages prévus cet après-midi — Restez prudents en montagne
        </div>
      )}
    </div>
  )
}

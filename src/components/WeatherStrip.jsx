import { useWeather } from '../hooks/useWeather'

const WC_ICON = { 0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',51:'🌦',61:'🌧',63:'🌧',80:'🌦',81:'🌧',95:'⛈',96:'⛈' }

function TempCurve({ hours }) {
  const dh = hours.filter(h => h.h >= 6 && h.h <= 22)
  if (dh.length < 3) return null
  const temps = dh.map(h => h.temp)
  const min = Math.min(...temps) - 1, max = Math.max(...temps) + 1, range = max - min || 1
  const w = 500, ht = 40, px = 16, py = 6
  const pts = dh.map((hr, i) => ({ x: px + (i/(dh.length-1))*(w-2*px), y: py + (1-(hr.temp-min)/range)*(ht-2*py), temp: hr.temp }))
  let path = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length-1; i++) { const cx=(pts[i].x+pts[i+1].x)/2; path += ` C ${cx} ${pts[i].y}, ${cx} ${pts[i+1].y}, ${pts[i+1].x} ${pts[i+1].y}` }
  return (
    <svg viewBox={`0 0 ${w} ${ht+12}`} style={{ width:'100%', height:'auto', display:'block' }}>
      <defs><linearGradient id="wcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1D9E75" stopOpacity=".18"/><stop offset="100%" stopColor="#1D9E75" stopOpacity="0"/></linearGradient></defs>
      <path d={`${path} L ${pts[pts.length-1].x} ${ht+2} L ${pts[0].x} ${ht+2} Z`} fill="url(#wcg)"/>
      <path d={path} fill="none" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round"/>
      {pts.filter((_,i) => i%3===0 || i===pts.length-1).map((p,i) => (
        <g key={i}><circle cx={p.x} cy={p.y} r="2" fill="#1D9E75" stroke="#fff" strokeWidth="1.2"/>
          <text x={p.x} y={p.y+10} textAnchor="middle" fontSize="6.5" fill="#888" fontFamily="Inter,sans-serif">{p.temp}°</text></g>
      ))}
    </svg>
  )
}

export default function WeatherStrip({ lat, lon, locationName }) {
  const { weather, loading } = useWeather(lat, lon)
  if (!lat || !lon) return <div className="weather-strip">📍 Localisez le séjour pour voir la météo</div>
  if (loading) return <div className="weather-strip">🌤 Chargement météo…</div>
  if (!weather) return <div className="weather-strip">🌤 Météo indisponible</div>

  const nowIdx = weather.hours.findIndex(h => h.isNow)
  const displayHours = weather.hours.filter(h => h.h >= (nowIdx >= 0 ? weather.hours[nowIdx].h : 6))

  const metricBox = { flex:1, textAlign:'center', padding:'.45rem .3rem' }
  const metricIcon = { fontSize:'.95rem', marginBottom:2 }
  const metricLabel = { fontSize:'.6rem', color:'var(--text-muted)', fontWeight:500, marginBottom:1 }
  const metricValue = { fontSize:'.82rem', fontWeight:700, color:'var(--text)' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>

      {/* ── Card 1 : Résumé ── */}
      <div style={{ background:'var(--card)', borderRadius:12, border:'1px solid var(--border)', padding:'.8rem 1rem', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
        {/* Top line */}
        <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom:'.55rem', display:'flex', alignItems:'center', gap:'.4rem' }}>
          <span>📍</span>
          <span style={{ fontWeight:600, color:'var(--text)' }}>{locationName || 'Position'}</span>
          <span>·</span>
          <span>{weather.temp}°C</span>
          <span style={{ }}>{weather.label}</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          {/* Left — big icon + temp */}
          <div style={{ display:'flex', alignItems:'center', gap:'.65rem', flex:'0 0 auto' }}>
            <div style={{ fontSize:'2.8rem', lineHeight:1 }}>{weather.icon}</div>
            <div>
              <div style={{ display:'flex', alignItems:'flex-start' }}>
                <span style={{ fontSize:'2.2rem', fontWeight:700, lineHeight:1 }}>{weather.temp}</span>
                <span style={{ fontSize:'.85rem', fontWeight:500, marginTop:2 }}>°C</span>
              </div>
              <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>Ressenti {weather.feelsLike}°C</div>
              <div style={{ display:'flex', gap:'.65rem', marginTop:'.35rem', fontSize:'.72rem', color:'var(--text-muted)' }}>
                <span>💨 Vent {weather.wind} km/h</span>
                <span>💧 {weather.rainProb} % pluie</span>
              </div>
            </div>
          </div>

          {/* Right — 4 metric boxes */}
          <div style={{ flex:1, display:'flex', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginLeft:'auto' }}>
            <div style={metricBox}>
              <div style={metricIcon}>🌡</div>
              <div style={metricLabel}>Min / Max</div>
              <div style={metricValue}>{weather.tempMin}° / {weather.tempMax}°</div>
            </div>
            <div style={{ width:1, background:'var(--border)' }} />
            <div style={metricBox}>
              <div style={metricIcon}>💨</div>
              <div style={metricLabel}>Vent</div>
              <div style={metricValue}>{weather.wind} km/h</div>
            </div>
            <div style={{ width:1, background:'var(--border)' }} />
            <div style={metricBox}>
              <div style={metricIcon}>💧</div>
              <div style={metricLabel}>Humidité</div>
              <div style={metricValue}>{weather.humidity} %</div>
            </div>
            <div style={{ width:1, background:'var(--border)' }} />
            <div style={metricBox}>
              <div style={metricIcon}>🌅</div>
              <div style={metricLabel}>Lever / Coucher</div>
              <div style={metricValue}>{weather.sunrise} / {weather.sunset}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 2 : Prévisions heure par heure ── */}
      <div style={{ background:'var(--card)', borderRadius:12, border:'1px solid var(--border)', padding:'.65rem .8rem', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
        <div style={{ fontSize:'.75rem', fontWeight:600, color:'var(--text)', marginBottom:'.5rem' }}>Prévisions heure par heure</div>
        <div style={{ overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
          <div style={{ display:'flex', gap:'.35rem', minWidth:'max-content' }}>
            {displayHours.map((h, i) => (
              <div key={i} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                minWidth:68, padding:'.45rem .35rem .5rem',
                borderRadius:10,
                border: h.isNow ? '2px solid var(--green)' : '1.5px solid var(--border)',
                background: h.isNow ? 'var(--green-light)' : 'transparent',
              }}>
                <div style={{ fontSize:'.65rem', fontWeight: h.isNow?700:500, color: h.isNow?'var(--green)':'var(--text-muted)' }}>
                  {h.isNow ? 'Maintenant' : h.h+'h00'}
                </div>
                <div style={{ fontSize:'1.4rem', lineHeight:1 }}>{WC_ICON[h.wc]||'🌡'}</div>
                <div style={{ fontSize:'.92rem', fontWeight:700 }}>{h.temp}°</div>
                <div style={{ fontSize:'.58rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:2 }}>
                  💨 {h.wind} km/h
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Card 3 : Courbe température ── */}
      <div style={{ background:'var(--card)', borderRadius:12, border:'1px solid var(--border)', padding:'.5rem .8rem .6rem', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
        <TempCurve hours={weather.hours} />
      </div>

      {/* Storm warning */}
      {weather.hasStorm && (
        <div style={{ background:'var(--amber-light)', color:'var(--amber)', borderRadius:10, padding:'.5rem .85rem', fontSize:'.75rem', fontWeight:600 }}>
          ⚠️ Orages prévus — Prudence en montagne
        </div>
      )}
    </div>
  )
}

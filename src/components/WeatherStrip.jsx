import { useWeather } from '../hooks/useWeather'

const WC_ICON = { 0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',51:'🌦',61:'🌧',63:'🌧',80:'🌦',81:'🌧',95:'⛈',96:'⛈' }
function uvLabel(uv) { return uv<=2?'faible':uv<=5?'modéré':uv<=7?'élevé':uv<=10?'très élevé':'extrême' }

function TempCurve({ hours }) {
  const dh = hours.filter(h => h.h >= 6 && h.h <= 22)
  if (dh.length < 3) return null
  const temps = dh.map(h => h.temp)
  const min = Math.min(...temps) - 1, max = Math.max(...temps) + 1, range = max - min || 1
  const w = 560, h = 55, px = 20, py = 8
  const pts = dh.map((hr, i) => ({ x: px + (i/(dh.length-1))*(w-2*px), y: py + (1-(hr.temp-min)/range)*(h-2*py), temp: hr.temp }))
  let path = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length-1; i++) { const cx=(pts[i].x+pts[i+1].x)/2; path += ` C ${cx} ${pts[i].y}, ${cx} ${pts[i+1].y}, ${pts[i+1].x} ${pts[i+1].y}` }
  return (
    <svg viewBox={`0 0 ${w} ${h+14}`} style={{ width:'100%', height:'auto', display:'block' }}>
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--green)" stopOpacity=".2"/><stop offset="100%" stopColor="var(--green)" stopOpacity="0"/></linearGradient></defs>
      <path d={`${path} L ${pts[pts.length-1].x} ${h+2} L ${pts[0].x} ${h+2} Z`} fill="url(#cg)"/>
      <path d={path} fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round"/>
      {pts.filter((_,i) => i % 2 === 0 || i === pts.length-1).map((p,i) => (
        <g key={i}><circle cx={p.x} cy={p.y} r="2.5" fill="var(--green)" stroke="#fff" strokeWidth="1.5"/>
          <text x={p.x} y={p.y+12} textAnchor="middle" fontSize="7.5" fill="var(--text-muted)" fontFamily="Inter,sans-serif">{p.temp}°</text></g>
      ))}
    </svg>
  )
}

export default function WeatherStrip({ lat, lon, locationName }) {
  const { weather, loading } = useWeather(lat, lon)
  if (!lat || !lon) return <div className="weather-strip">📍 Localisez le séjour pour voir la météo</div>
  if (loading) return <div className="weather-strip">🌤 Chargement météo…</div>
  if (!weather) return <div className="weather-strip">🌤 Météo indisponible — <a href="https://meteo.fr" target="_blank" rel="noreferrer" style={{ color:'inherit', fontWeight:600 }}>meteo.fr →</a></div>

  const displayHours = weather.hours.filter(h => h.h >= 6 && h.h <= 22)

  return (
    <div style={{ background:'var(--card)', borderRadius:12, border:'1px solid var(--border)', overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
      {/* Main row — compact */}
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'.75rem 1.1rem', flexWrap:'wrap' }}>
        <div style={{ fontSize:'2rem', lineHeight:1 }}>{weather.icon}</div>
        <div>
          <div style={{ display:'flex', alignItems:'baseline', gap:'.35rem' }}>
            <span style={{ fontSize:'1.6rem', fontWeight:700, lineHeight:1 }}>{weather.temp}°</span>
            <span style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{weather.label}</span>
          </div>
          <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>Ressenti {weather.feelsLike}°</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'.75rem', flexWrap:'wrap', fontSize:'.72rem', color:'var(--text-muted)' }}>
          <span>💨 {weather.wind} km/h</span>
          <span>💧 {weather.rainProb}%</span>
          <span style={{ color:'var(--red)' }}>↑ {weather.tempMax}°</span>
          <span style={{ color:'var(--blue)' }}>↓ {weather.tempMin}°</span>
          <span>☀️ UV {weather.uvMax} ({uvLabel(weather.uvMax)})</span>
        </div>
      </div>

      {/* Hourly — compact scroll */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'.4rem .6rem', overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
        <div style={{ display:'flex', gap:0, minWidth:'max-content' }}>
          {displayHours.map((h, i) => (
            <div key={i} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:1,
              minWidth:44, padding:'4px 3px',
              borderRadius:8,
              border: h.isNow ? '1.5px solid var(--green)' : '1.5px solid transparent',
              background: h.isNow ? 'var(--green-light)' : 'transparent',
            }}>
              <div style={{ fontSize:'.58rem', fontWeight: h.isNow?700:400, color: h.isNow?'var(--green)':'var(--text-muted)' }}>{h.isNow?'Now':h.h+'h'}</div>
              <div style={{ fontSize:'.9rem', lineHeight:1 }}>{WC_ICON[h.wc]||'🌡'}</div>
              <div style={{ fontSize:'.68rem', fontWeight:600 }}>{h.temp}°</div>
            </div>
          ))}
        </div>
      </div>

      {/* Curve — compact */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'.3rem .8rem .5rem' }}>
        <TempCurve hours={weather.hours} />
      </div>

      {weather.hasStorm && (
        <div style={{ background:'var(--amber-light)', color:'var(--amber)', padding:'.4rem 1rem', fontSize:'.72rem', fontWeight:600, borderTop:'1px solid rgba(143,78,32,.15)' }}>
          ⚠️ Orages prévus — Prudence en montagne
        </div>
      )}
    </div>
  )
}

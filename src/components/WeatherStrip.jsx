import { useState, useEffect } from 'react'
import { useWeather } from '../hooks/useWeather'

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768)
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  return m
}

const WC_ICON = { 0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',51:'🌦',61:'🌧',63:'🌧',80:'🌦',81:'🌧',95:'⛈',96:'⛈' }

export default function WeatherStrip({ lat, lon, locationName }) {
  const { weather, loading } = useWeather(lat, lon)
  const mob = useIsMobile()
  if (!lat || !lon) return <div className="weather-strip">📍 Localisez le séjour pour voir la météo</div>
  if (loading) return <div className="weather-strip">🌤 Chargement météo…</div>
  if (!weather) return <div className="weather-strip">🌤 Météo indisponible</div>

  const nowIdx = weather.hours.findIndex(h => h.isNow)
  const displayHours = weather.hours.filter(h => h.h >= (nowIdx >= 0 ? weather.hours[nowIdx].h : 6))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: mob ? '.4rem' : '.5rem' }}>
      {/* Card 1 : Résumé */}
      <div style={{ background:'var(--card)', borderRadius:12, border:'1px solid var(--border)', padding: mob ? '.6rem .7rem' : '.8rem 1rem', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
        <div style={{ fontSize:'.7rem', color:'var(--text-muted)', marginBottom:'.4rem', display:'flex', alignItems:'center', gap:'.3rem', flexWrap:'wrap' }}>
          <span>📍</span>
          <span style={{ fontWeight:600, color:'var(--text)' }}>{locationName || 'Position'}</span>
          <span>· {weather.temp}°C · {weather.label}</span>
        </div>

        {/* Main: icon+temp left, details right */}
        <div style={{ display:'flex', alignItems:'center', gap: mob ? '.5rem' : '1rem', marginBottom: mob ? '.5rem' : '.55rem' }}>
          <div style={{ fontSize: mob ? '2rem' : '2.8rem', lineHeight:1 }}>{weather.icon}</div>
          <div>
            <div style={{ display:'flex', alignItems:'flex-start' }}>
              <span style={{ fontSize: mob ? '1.6rem' : '2.2rem', fontWeight:700, lineHeight:1 }}>{weather.temp}</span>
              <span style={{ fontSize:'.75rem', fontWeight:500, marginTop:2 }}>°C</span>
            </div>
            <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>Ressenti {weather.feelsLike}°C</div>
          </div>
          {!mob && (
            <div style={{ marginLeft:'auto', display:'flex', gap:'.6rem', fontSize:'.72rem', color:'var(--text-muted)', flexWrap:'wrap' }}>
              <span>💨 {weather.wind} km/h</span>
              <span>💧 {weather.rainProb}%</span>
            </div>
          )}
        </div>

        {/* Metric boxes */}
        <div style={{ display:'grid', gridTemplateColumns: mob ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap:1, border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', background:'var(--border)' }}>
          {[
            { icon:'🌡', label:'Min / Max', val:`${weather.tempMin}° / ${weather.tempMax}°` },
            { icon:'💨', label:'Vent', val:`${weather.wind} km/h` },
            { icon:'💧', label:'Humidité', val:`${weather.humidity}%` },
            { icon:'🌅', label:'Lever / Coucher', val:`${weather.sunrise} / ${weather.sunset}` },
          ].map((m, i) => (
            <div key={i} style={{ background:'var(--card)', textAlign:'center', padding: mob ? '.35rem .2rem' : '.4rem .3rem' }}>
              <div style={{ fontSize: mob ? '.75rem' : '.9rem', marginBottom:1 }}>{m.icon}</div>
              <div style={{ fontSize:'.55rem', color:'var(--text-muted)', fontWeight:500 }}>{m.label}</div>
              <div style={{ fontSize: mob ? '.72rem' : '.8rem', fontWeight:700 }}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2 : Prévisions horaires */}
      <div style={{ background:'var(--card)', borderRadius:12, border:'1px solid var(--border)', padding: mob ? '.5rem .5rem' : '.65rem .8rem', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
        <div style={{ fontSize:'.72rem', fontWeight:600, marginBottom:'.4rem' }}>Prévisions heure par heure</div>
        <div style={{ overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
          <div style={{ display:'flex', gap: mob ? '.25rem' : '.35rem', minWidth:'max-content' }}>
            {displayHours.map((h, i) => (
              <div key={i} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                minWidth: mob ? 52 : 68, padding: mob ? '.3rem .2rem .35rem' : '.45rem .35rem .5rem',
                borderRadius: mob ? 8 : 10,
                border: h.isNow ? '2px solid var(--green)' : '1.5px solid var(--border)',
                background: h.isNow ? 'var(--green-light)' : 'transparent',
              }}>
                <div style={{ fontSize: mob ? '.55rem' : '.65rem', fontWeight: h.isNow?700:500, color: h.isNow?'var(--green)':'var(--text-muted)' }}>
                  {h.isNow ? 'Now' : h.h+'h'}
                </div>
                <div style={{ fontSize: mob ? '1rem' : '1.4rem', lineHeight:1 }}>{WC_ICON[h.wc]||'🌡'}</div>
                <div style={{ fontSize: mob ? '.75rem' : '.92rem', fontWeight:700 }}>{h.temp}°</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {weather.hasStorm && (
        <div style={{ background:'var(--amber-light)', color:'var(--amber)', borderRadius:10, padding:'.4rem .7rem', fontSize:'.72rem', fontWeight:600 }}>
          ⚠️ Orages prévus — Prudence en montagne
        </div>
      )}
    </div>
  )
}

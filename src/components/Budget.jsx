import { useState, useMemo, useEffect } from 'react'

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768)
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])
  return m
}

/* ─── DESIGN TOKENS ────────────────────────────────────────────── */
const R = 16, SP = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
const SHADOW = '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)'
const CAT_COLORS = { transport:'#378ADD', repas:'#1D9E75', activites:'#BA7517', hebergement:'#7F77DD', courses:'#D85A30', autre:'#888780' }
const CAT_LABELS = { transport:'Transport', repas:'Repas', activites:'Activités', hebergement:'Hébergement', courses:'Courses', autre:'Autre' }
const CAT_ICONS = { transport:'🚗', repas:'🍽️', activites:'🎯', hebergement:'🏨', courses:'🛒', autre:'📦' }

function fmt(n) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n||0) }
function fmtDate(ts) { if (!ts) return ''; const d = new Date(ts); return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) }
function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 3600000) return "Il y a " + Math.max(1, Math.floor(diff/60000)) + " min"
  if (diff < 86400000) return "Il y a " + Math.floor(diff/3600000) + "h"
  if (diff < 172800000) return "Hier"
  return fmtDate(ts)
}

/* ─── TRICOUNT LOGIC ───────────────────────────────────────────── */
function calcBalances(expenses, voyageurs) {
  const paid = {}, owes = {}
  voyageurs.forEach(v => { paid[v.id] = 0; owes[v.id] = 0 })
  expenses.filter(e => e.type === 'common' && !e.settled).forEach(exp => {
    const amount = parseFloat(exp.amount) || 0
    const parts = exp.participants?.length ? exp.participants : voyageurs.map(v => v.id)
    const share = amount / parts.length
    paid[exp.payerId] = (paid[exp.payerId] || 0) + amount
    parts.forEach(vid => { owes[vid] = (owes[vid] || 0) + share })
  })
  const balances = {}
  voyageurs.forEach(v => { balances[v.id] = Math.round(((paid[v.id]||0) - (owes[v.id]||0)) * 100) / 100 })
  const debts = []
  const pos = voyageurs.filter(v => balances[v.id] > 0.5).map(v => ({ ...v, bal: balances[v.id] }))
  const neg = voyageurs.filter(v => balances[v.id] < -0.5).map(v => ({ ...v, bal: -balances[v.id] }))
  let i=0, j=0
  while (i<pos.length && j<neg.length) {
    const amount = Math.round(Math.min(pos[i].bal, neg[j].bal))
    if (amount > 0) debts.push({ from: neg[j], to: pos[i], amount })
    pos[i].bal -= amount; neg[j].bal -= amount
    if (pos[i].bal < 0.5) i++
    if (neg[j].bal < 0.5) j++
  }
  return { paid, owes, balances, debts }
}

/* ─── SHARED COMPONENTS ───────────────────────────────────────── */
function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:R, padding:`${SP.lg}px`, boxShadow:SHADOW, ...style }}>{children}</div>
}
function Badge({ label, color, bg }) {
  return <span style={{ fontSize:'.7rem', fontWeight:600, padding:'3px 10px', borderRadius:20, background:bg||'var(--gray-light)', color:color||'var(--text-muted)', whiteSpace:'nowrap' }}>{label}</span>
}
function SectionLabel({ children }) {
  return <div style={{ fontSize:'.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:SP.sm }}>{children}</div>
}
function Avatar({ name, size=28, color='var(--green)' }) {
  return <div style={{ width:size, height:size, borderRadius:'50%', background:color+'22', color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.38, fontWeight:700, flexShrink:0 }}>{name?.charAt(0)||'?'}</div>
}
function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:R, padding:`${SP.md}px ${SP.lg}px`, textAlign:'center' }}>
      <div style={{ fontSize:'.68rem', color:'var(--text-muted)', marginBottom:SP.xs }}>{label}</div>
      <div style={{ fontSize:'1.35rem', fontWeight:700, color: accent || 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize:'.7rem', color:'var(--text-muted)', marginTop:2 }}>{sub}</div>}
    </div>
  )
}

/* ─── DONUT CHART ──────────────────────────────────────────────── */
function DonutChart({ data, total, size=140, isMobile=false }) {
  const r = size/2, ir = r*.62, c = Math.PI*2*((r+ir)/2)
  let offset = 0
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map(({ value, color }, i) => {
          const pct = total > 0 ? value/total : 0
          const len = c * pct, gap = c - len
          const o = offset; offset += pct
          return <circle key={i} cx={r} cy={r} r={(r+ir)/2} fill="none" stroke={color} strokeWidth={r-ir}
            strokeDasharray={`${len} ${gap}`} strokeDashoffset={-c*o + c/4}
            style={{ transition:'all .5s ease' }} />
        })}
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:'1.1rem', fontWeight:700 }}>{fmt(total)}</div>
        <div style={{ fontSize:'.62rem', color:'var(--text-muted)' }}>Total</div>
      </div>
    </div>
  )
}

/* ─── ADD EXPENSE MODAL ────────────────────────────────────────── */
function AddExpenseForm({ voyageurs, days, onAdd, onClose, currentVoyageurId }) {
  const [form, setForm] = useState({
    label:'', amount:'', category:'repas', type:'common',
    payerId: currentVoyageurId || voyageurs[0]?.id || '',
    participants: voyageurs.map(v => v.id),
    dayId: days[0]?.id || '', date: days[0]?.date || ''
  })
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))
  const toggleP = (vid) => {
    const p = form.participants.includes(vid) ? form.participants.filter(x=>x!==vid) : [...form.participants, vid]
    if (p.length > 0) set('participants', p)
  }
  const submit = () => {
    if (!form.label.trim() || !form.amount) return alert('Titre et montant requis')
    onAdd({ ...form, id:'exp_'+Date.now(), amount:parseFloat(form.amount), createdAt:Date.now() })
    onClose()
  }
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:480 }}>
        <h2 style={{ marginBottom:SP.lg }}>💰 Nouvelle dépense</h2>
        <div className="form-group"><label>Description *</label><input value={form.label} onChange={e=>set('label',e.target.value)} placeholder="ex: Déjeuner au refuge…" autoFocus /></div>
        <div className="form-row">
          <div className="form-group"><label>Montant (€) *</label><input type="number" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0" /></div>
          <div className="form-group"><label>Catégorie</label>
            <select value={form.category} onChange={e=>set('category',e.target.value)}>{Object.entries(CAT_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
          </div>
        </div>
        <div className="form-group"><label>Journée</label>
          <select value={form.dayId} onChange={e => { const day=days.find(d=>d.id===e.target.value); set('dayId',e.target.value); set('date',day?.date||'') }}>
            <option value="">Sans journée</option>
            {days.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Type de dépense</label>
          <div style={{ display:'flex', gap:SP.sm }}>
            {[['common','👥 Commune','Partagée entre voyageurs'],['perso','👤 Perso','Visible uniquement par toi']].map(([val,lbl,desc])=>(
              <button key={val} onClick={()=>set('type',val)} style={{
                flex:1, padding:SP.sm+'px', border:`1.5px solid ${form.type===val?'var(--green)':'var(--border)'}`,
                borderRadius:R, background:form.type===val?'var(--green-light)':'transparent', cursor:'pointer', fontFamily:'inherit', textAlign:'left'
              }}>
                <div style={{ fontSize:'.82rem', fontWeight:600, color:form.type===val?'var(--green)':'var(--text)' }}>{lbl}</div>
                <div style={{ fontSize:'.68rem', color:'var(--text-muted)', marginTop:2 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
        {form.type==='common' && (<>
          <div className="form-group"><label>Payé par</label>
            <select value={form.payerId} onChange={e=>set('payerId',e.target.value)}>{voyageurs.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Pour qui</label>
            <div style={{ display:'flex', gap:SP.xs, flexWrap:'wrap', marginTop:SP.xs, alignItems:'center' }}>
              <button onClick={()=>set('participants', form.participants.length===voyageurs.length?[]:voyageurs.map(v=>v.id))} style={{
                padding:'5px 12px', borderRadius:20, border:`1.5px solid ${form.participants.length===voyageurs.length?'var(--green)':'var(--border)'}`,
                background:form.participants.length===voyageurs.length?'var(--green)':'transparent', color:form.participants.length===voyageurs.length?'#fff':'var(--text-muted)',
                cursor:'pointer', fontFamily:'inherit', fontSize:'.78rem', fontWeight:600
              }}>👥 Tous</button>
              {voyageurs.map(v=>(
                <button key={v.id} onClick={()=>toggleP(v.id)} style={{
                  padding:'5px 12px', borderRadius:20, border:`1.5px solid ${form.participants.includes(v.id)?'var(--green)':'var(--border)'}`,
                  background:form.participants.includes(v.id)?'var(--green)':'transparent', color:form.participants.includes(v.id)?'#fff':'var(--text-muted)',
                  cursor:'pointer', fontFamily:'inherit', fontSize:'.8rem', fontWeight:500
                }}>{v.name}</button>
              ))}
            </div>
            {form.participants.length>0 && form.amount && <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:SP.xs }}>= {fmt(parseFloat(form.amount)/form.participants.length)} / personne</div>}
          </div>
        </>)}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={submit}>＋ Ajouter</button>
        </div>
      </div>
    </div>
  )
}

/* ─── EXPENSE CARD ─────────────────────────────────────────────── */
function ExpenseCard({ exp, voyageurs, onDelete, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const payer = voyageurs.find(v => v.id === exp.payerId)
  const catColor = CAT_COLORS[exp.category] || '#888'
  const catIcon = CAT_ICONS[exp.category] || '📦'
  return (
    <Card style={{ padding:`${SP.md}px ${SP.lg}px`, marginBottom:SP.sm, position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:SP.md }}>
        <div style={{ width:40, height:40, borderRadius:12, background:catColor+'18', color:catColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>{catIcon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'.88rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{exp.label}</div>
          <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:2, display:'flex', gap:SP.sm, flexWrap:'wrap', alignItems:'center' }}>
            {exp.type === 'common' ? <span>Dépense commune · {payer?.name||'?'}</span> : <span>Dépense perso</span>}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:'1rem', fontWeight:700 }}>{fmt(exp.amount)}</div>
          <div style={{ fontSize:'.68rem', color:'var(--text-muted)', marginTop:2 }}>{timeAgo(exp.createdAt)}</div>
        </div>
        <div style={{ position:'relative', flexShrink:0 }}>
          <button onClick={()=>setMenuOpen(!menuOpen)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1rem', padding:'4px 6px', color:'var(--text-muted)' }}>⋯</button>
          {menuOpen && (
            <div style={{ position:'absolute', right:0, top:'100%', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:10, minWidth:160, overflow:'hidden' }}>
              {onDelete && <button onClick={()=>{setMenuOpen(false);onDelete()}} style={{ display:'block', width:'100%', padding:'10px 16px', border:'none', background:'none', cursor:'pointer', fontSize:'.82rem', fontFamily:'inherit', textAlign:'left', color:'var(--red)' }}>🗑 Supprimer</button>}
            </div>
          )}
        </div>
      </div>
      <div style={{ display:'flex', gap:SP.xs, marginTop:SP.sm }}>
        <Badge label={CAT_LABELS[exp.category]||exp.category} color={catColor} bg={catColor+'18'} />
        <Badge label={exp.type==='common'?'Commun':'Perso'} color={exp.type==='common'?'var(--blue)':'var(--text-muted)'} bg={exp.type==='common'?'var(--blue-light)':'var(--gray-light)'} />
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 1 — VUE D'ENSEMBLE
   ═══════════════════════════════════════════════════════════════════ */
function VueEnsemble({ isMobile, budget, totalCommon, totalPerso, totalAll, pct, barColor, voyageurs, paid, balances, byCat, commonExpenses, myPersonalExpenses, days, onShowAdd }) {
  const recentExpenses = [...commonExpenses, ...myPersonalExpenses].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0, 4)
  const perDay = days.length > 0 ? Math.round(totalAll / days.length) : 0

  return (
    <div>
      {/* Budget header */}
      <Card style={{ marginBottom:SP.lg }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:SP.sm, flexWrap:'wrap', gap:SP.sm }}>
          <div>
            <div style={{ fontSize:'.65rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)' }}>Budget mensuel</div>
            <div style={{ fontSize:'2rem', fontWeight:700, lineHeight:1.2 }}>{budget > 0 ? fmt(budget) : '—'}</div>
          </div>
          {budget > 0 && (
            <div style={{ padding:'6px 14px', borderRadius:20, background: pct >= 100 ? 'var(--red-light)' : pct >= 80 ? 'var(--amber-light)' : 'var(--green-light)', color: pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : 'var(--green)', fontSize:'.78rem', fontWeight:600 }}>
              {pct >= 100 ? '⚠️ Budget dépassé' : pct >= 80 ? '⚠️ Attention' : '✅ En bonne voie'}
            </div>
          )}
        </div>
        {budget > 0 && (<>
          <div style={{ height:10, background:'rgba(0,0,0,.06)', borderRadius:20, overflow:'hidden', marginBottom:SP.sm }}>
            <div style={{ height:'100%', width:Math.min(pct,100)+'%', background:barColor, borderRadius:20, transition:'width .5s' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.75rem', color:'var(--text-muted)' }}>
            <span>{fmt(totalAll)} dépensé</span>
            <span style={{ fontWeight:600, color: pct>=100?'var(--red)':'var(--text)' }}>{fmt(Math.max(0,budget-totalAll))} restant</span>
          </div>
        </>)}
      </Card>

      {/* Metrics row */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap:SP.sm, marginBottom:SP.lg }}>
        <MetricCard label="Total dépensé" value={fmt(totalAll)} />
        <MetricCard label="Commun" value={fmt(totalCommon)} accent="var(--blue)" />
        <MetricCard label="Perso" value={fmt(totalPerso)} accent="var(--green)" />
        <MetricCard label="Par jour (moy.)" value={fmt(perDay)} />
      </div>

      {/* Two columns: categories + expenses by day */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? SP.md : SP.lg, marginBottom:SP.lg }}>
        {/* Donut categories */}
        <Card>
          <SectionLabel>Répartition par catégorie</SectionLabel>
          <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems:'center', gap: isMobile ? SP.md : SP.lg }}>
            <DonutChart
              data={Object.entries(byCat)}.map(([cat,amt])=>({ value:amt, color:CAT_COLORS[cat]||'#888' }))}
              total={totalCommon}
            />
            <div style={{ flex:1 }}>
              {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
                <div key={cat} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 0', fontSize:'.8rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:SP.sm }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:CAT_COLORS[cat]||'#888' }} />
                    <span>{CAT_LABELS[cat]||cat}</span>
                  </div>
                  <div style={{ display:'flex', gap:SP.sm, alignItems:'center' }}>
                    <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>{totalCommon>0?Math.round(amt/totalCommon*100):0}%</span>
                    <span style={{ fontWeight:600, fontSize:'.82rem' }}>{fmt(amt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Expenses by day */}
        <Card>
          <SectionLabel>Dépenses communes par jour</SectionLabel>
          {days.map(d => {
            const dayTotal = commonExpenses.filter(e=>e.dayId===d.id).reduce((s,e)=>s+(parseFloat(e.amount)||0),0)
            const maxDay = Math.max(...days.map(dd => commonExpenses.filter(e=>e.dayId===dd.id).reduce((s,e)=>s+(parseFloat(e.amount)||0),0)), 1)
            return (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:SP.sm, marginBottom:SP.xs, fontSize:'.8rem' }}>
                <span style={{ width:35, color:'var(--text-muted)', flexShrink:0, fontSize:'.72rem' }}>{d.label?.split('.')[0]}.</span>
                <div style={{ flex:1, height:8, background:'rgba(0,0,0,.04)', borderRadius:20, overflow:'hidden' }}>
                  <div style={{ height:'100%', width: maxDay>0?(dayTotal/maxDay*100)+'%':'0%', background:'var(--green)', borderRadius:20, transition:'width .3s' }} />
                </div>
                <span style={{ width:45, textAlign:'right', fontWeight:dayTotal>0?600:400, flexShrink:0, fontSize:'.78rem', color:dayTotal>0?'var(--text)':'var(--text-light)' }}>{dayTotal>0?fmt(dayTotal):'—'}</span>
              </div>
            )
          })}
        </Card>
      </div>

      {/* Recent expenses + Balance */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? SP.md : SP.lg }}>
        {/* Recent */}
        <Card>
          <SectionLabel>Dépenses récentes</SectionLabel>
          {recentExpenses.length === 0 ? (
            <div style={{ textAlign:'center', padding:SP.lg+'px', color:'var(--text-muted)', fontSize:'.85rem' }}>Aucune dépense</div>
          ) : recentExpenses.map(exp => {
            const payer = voyageurs.find(v=>v.id===exp.payerId)
            return (
              <div key={exp.id} style={{ display:'flex', alignItems:'center', gap:SP.md, padding:`${SP.sm}px 0`, borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:32, height:32, borderRadius:10, background:(CAT_COLORS[exp.category]||'#888')+'18', color:CAT_COLORS[exp.category]||'#888', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem', flexShrink:0 }}>{CAT_ICONS[exp.category]||'📦'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'.82rem', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{exp.label}</div>
                  <div style={{ fontSize:'.68rem', color:'var(--text-muted)' }}>{exp.type==='common'?`Dépense commune · ${payer?.name||'?'}`:'Dépense perso'}</div>
                </div>
                <div style={{ fontWeight:600, fontSize:'.88rem', flexShrink:0 }}>{fmt(exp.amount)}</div>
              </div>
            )
          })}
          {recentExpenses.length > 0 && <button onClick={()=>{}} style={{ display:'block', width:'100%', border:'none', background:'none', color:'var(--green)', fontSize:'.78rem', fontWeight:600, padding:`${SP.sm}px 0`, cursor:'pointer', fontFamily:'inherit', textAlign:'center', marginTop:SP.sm }}>Voir tout →</button>}
        </Card>

        {/* Balance per person */}
        <Card>
          <SectionLabel>Bilan par personne</SectionLabel>
          {voyageurs.map(v => (
            <div key={v.id} style={{ display:'flex', alignItems:'center', gap:SP.md, padding:`${SP.sm}px 0`, borderBottom:'1px solid var(--border)' }}>
              <Avatar name={v.name} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'.84rem', fontWeight:500 }}>{v.name}</div>
                <div style={{ fontSize:'.68rem', color:'var(--text-muted)' }}>A payé {fmt(paid[v.id]||0)} · Doit payer {fmt(Math.round((paid[v.id]||0)-(balances[v.id]||0)))}</div>
              </div>
              <span style={{ fontWeight:600, fontSize:'.88rem', color: (balances[v.id]||0)>0.5?'var(--green)':(balances[v.id]||0)<-0.5?'var(--red)':'var(--text-muted)' }}>
                {(balances[v.id]||0)>0.5?'+':''}{fmt(balances[v.id]||0)}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* CTA */}
      <button onClick={onShowAdd} style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:SP.sm, width:'100%', marginTop:SP.lg,
        padding:'12px', border:'2px dashed var(--border)', borderRadius:R, background:'transparent',
        cursor:'pointer', fontSize:'.85rem', color:'var(--text-muted)', fontFamily:'inherit', fontWeight:500,
        transition:'all .15s'
      }}>＋ Ajouter une dépense</button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 2 — DÉPENSES
   ═══════════════════════════════════════════════════════════════════ */
function Depenses({ commonExpenses, myPersonalExpenses, voyageurs, onDeleteCommon, onDeletePerso, onShowAdd }) {
  const [filter, setFilter] = useState('all') // all | common | perso
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const all = useMemo(() => {
    let list = filter === 'common' ? [...commonExpenses] : filter === 'perso' ? [...myPersonalExpenses] : [...commonExpenses, ...myPersonalExpenses]
    if (search) list = list.filter(e => e.label.toLowerCase().includes(search.toLowerCase()))
    if (catFilter) list = list.filter(e => e.category === catFilter)
    return list.sort((a,b) => (b.createdAt||0) - (a.createdAt||0))
  }, [filter, search, catFilter, commonExpenses, myPersonalExpenses])

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display:'flex', gap:SP.xs, marginBottom:SP.md }}>
        {[['all','Toutes'],['common','Communes'],['perso','Personnelles']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setFilter(id)} style={{
            padding:'7px 16px', borderRadius:20, border:'1.5px solid '+(filter===id?'var(--green)':'var(--border)'),
            background:filter===id?'var(--green)':'transparent', color:filter===id?'#fff':'var(--text-muted)',
            cursor:'pointer', fontFamily:'inherit', fontSize:'.8rem', fontWeight:500
          }}>{lbl}</button>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display:'flex', gap:SP.sm, marginBottom:SP.lg, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une dépense…"
          style={{ flex:1, minWidth:180, border:'1px solid var(--border)', borderRadius:R, padding:'8px 14px', fontSize:'.84rem', fontFamily:'inherit', background:'var(--card)' }} />
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          style={{ border:'1px solid var(--border)', borderRadius:R, padding:'8px 12px', fontSize:'.82rem', fontFamily:'inherit', background:'var(--card)', color:'var(--text)' }}>
          <option value="">Toutes catégories</option>
          {Object.entries(CAT_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontSize:'.75rem', color:'var(--text-muted)', marginBottom:SP.md }}>{all.length} dépense{all.length>1?'s':''}</div>

      {/* List */}
      {all.length === 0 ? (
        <div style={{ textAlign:'center', padding:`${SP.xl}px`, color:'var(--text-muted)', fontSize:'.88rem' }}>Aucune dépense trouvée</div>
      ) : all.map(exp => (
        <ExpenseCard key={exp.id} exp={exp} voyageurs={voyageurs}
          onDelete={exp.type==='common' ? ()=>onDeleteCommon(exp.id) : ()=>onDeletePerso(exp.id)} />
      ))}

      <button onClick={onShowAdd} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:SP.lg, borderRadius:R, padding:'12px' }}>
        ＋ Nouvelle dépense
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 3 — REMBOURSEMENTS (Splitwise style)
   ═══════════════════════════════════════════════════════════════════ */
function Remboursements({ debts, voyageurs, balances, paid, commonExpenses, activeVoyageurId, onSettle, isGuest }) {
  const settled = commonExpenses.filter(e => e.settled)
  const myBalance = balances[activeVoyageurId] || 0
  const iReceive = myBalance > 0.5
  const iPay = myBalance < -0.5

  return (
    <div>
      {/* My status card */}
      <Card style={{ marginBottom:SP.lg, textAlign:'center', padding:SP.xl+'px' }}>
        <div style={{ fontSize:'.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:SP.sm }}>
          {iReceive ? 'Tu dois recevoir' : iPay ? 'Tu dois payer' : 'Ton solde'}
        </div>
        <div style={{ fontSize:'2.2rem', fontWeight:700, color: iReceive ? 'var(--green)' : iPay ? 'var(--red)' : 'var(--text)', marginBottom:SP.xs }}>
          {fmt(Math.abs(myBalance))}
        </div>
        {!iReceive && !iPay && <div style={{ fontSize:'.85rem', color:'var(--green)' }}>✅ Tout est réglé !</div>}
      </Card>

      {/* Debts list */}
      {debts.length > 0 && (<>
        <SectionLabel>Remboursements à faire</SectionLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:SP.sm, marginBottom:SP.lg }}>
          {debts.map((debt, i) => (
            <Card key={i} style={{ padding:`${SP.lg}px` }}>
              <div style={{ display:'flex', alignItems:'center', gap:SP.md }}>
                <Avatar name={debt.from.name} size={36} color="var(--red)" />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'.88rem', fontWeight:600 }}>{debt.from.name}</div>
                  <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>doit rembourser</div>
                </div>
                <div style={{ fontSize:'.9rem', color:'var(--text-muted)', padding:'0 8px' }}>→</div>
                <Avatar name={debt.to.name} size={36} color="var(--green)" />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'.88rem', fontWeight:600 }}>{debt.to.name}</div>
                  <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>doit recevoir</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:'1.15rem', fontWeight:700, color:'var(--red)' }}>{fmt(debt.amount)}</div>
                </div>
              </div>
              {!isGuest && (
                <button onClick={()=>onSettle(debt)} style={{
                  display:'block', width:'100%', marginTop:SP.md, padding:'8px', border:'1.5px solid var(--green)',
                  borderRadius:R, background:'var(--green-light)', color:'var(--green)', cursor:'pointer',
                  fontFamily:'inherit', fontSize:'.82rem', fontWeight:600, textAlign:'center'
                }}>✓ Marquer comme réglé</button>
              )}
            </Card>
          ))}
        </div>
      </>)}

      {debts.length === 0 && (
        <Card style={{ textAlign:'center', padding:SP.xl+'px', marginBottom:SP.lg }}>
          <div style={{ fontSize:'1.5rem', marginBottom:SP.sm }}>🎉</div>
          <div style={{ fontSize:'.92rem', fontWeight:600, color:'var(--green)' }}>Tout le monde est quitte !</div>
          <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginTop:SP.xs }}>Aucun remboursement en attente</div>
        </Card>
      )}

      {/* Balance per person */}
      <SectionLabel>Répartition par personne</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:SP.lg }}>
        {voyageurs.map((v, idx) => {
          const bal = balances[v.id] || 0
          return (
            <div key={v.id} style={{ display:'flex', alignItems:'center', gap:SP.md, padding:`${SP.md}px ${SP.lg}px`, borderBottom: idx<voyageurs.length-1?'1px solid var(--border)':'none' }}>
              <Avatar name={v.name} />
              <div style={{ flex:1 }}><div style={{ fontSize:'.84rem', fontWeight:500 }}>{v.name}</div></div>
              <span style={{ fontWeight:600, fontSize:'.9rem', color: bal>0.5?'var(--green)':bal<-0.5?'var(--red)':'var(--text-muted)' }}>
                {bal > 0.5 ? '+' : ''}{fmt(bal)}
              </span>
            </div>
          )
        })}
      </Card>

      {/* History */}
      {settled.length > 0 && (<>
        <SectionLabel>Historique</SectionLabel>
        <Card style={{ padding:0, overflow:'hidden' }}>
          {settled.map((exp, idx) => (
            <div key={exp.id} style={{ display:'flex', alignItems:'center', gap:SP.md, padding:`${SP.sm}px ${SP.lg}px`, borderBottom:idx<settled.length-1?'1px solid var(--border)':'none', opacity:.65 }}>
              <span style={{ fontSize:'.85rem' }}>✓</span>
              <div style={{ flex:1, fontSize:'.82rem' }}>{exp.label}</div>
              <span style={{ fontWeight:600, fontSize:'.82rem' }}>{fmt(exp.amount)}</span>
            </div>
          ))}
        </Card>
      </>)}

      {/* How it works */}
      <Card style={{ marginTop:SP.lg, background:'var(--blue-light)', border:'1px solid rgba(55,138,221,.2)' }}>
        <div style={{ fontSize:'.82rem', fontWeight:600, color:'var(--blue)', marginBottom:SP.xs }}>💡 Comment ça fonctionne ?</div>
        <div style={{ fontSize:'.75rem', color:'var(--blue)', opacity:.8, lineHeight:1.5 }}>
          Les remboursements sont calculés automatiquement en fonction des dépenses communes et personnelles. Vous serez notifié lorsque quelqu'un vous rembourse.
        </div>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 4 — STATISTIQUES
   ═══════════════════════════════════════════════════════════════════ */
function Statistiques({ isMobile, totalCommon, totalPerso, totalAll, voyageurs, paid, byCat, commonExpenses, myPersonalExpenses, days, budget }) {
  const allExpenses = [...commonExpenses, ...myPersonalExpenses]

  // Who spends the most (common)
  const perPayer = {}
  commonExpenses.forEach(e => { perPayer[e.payerId] = (perPayer[e.payerId]||0) + (parseFloat(e.amount)||0) })

  // Per day evolution
  const dayTotals = days.map(d => ({
    label: d.label?.split('.')[0] || '',
    date: d.date,
    common: commonExpenses.filter(e=>e.dayId===d.id).reduce((s,e)=>s+(parseFloat(e.amount)||0), 0),
    perso: myPersonalExpenses.filter(e=>e.dayId===d.id).reduce((s,e)=>s+(parseFloat(e.amount)||0), 0),
  }))
  const maxDayTotal = Math.max(...dayTotals.map(d=>d.common+d.perso), 1)

  return (
    <div>
      {/* Aperçu général */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap:SP.sm, marginBottom:SP.lg }}>
        <MetricCard label="Total dépensé" value={fmt(totalAll)} accent="var(--text)" />
        <MetricCard label="Commun" value={fmt(totalCommon)} accent="var(--blue)" />
        <MetricCard label="Perso" value={fmt(totalPerso)} accent="var(--green)" />
        <MetricCard label="Par jour (moy.)" value={fmt(days.length>0?Math.round(totalAll/days.length):0)} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? SP.md : SP.lg, marginBottom:SP.lg }}>
        {/* Evolution by day - bar chart */}
        <Card>
          <SectionLabel>Évolution des dépenses</SectionLabel>
          <div style={{ display:'flex', alignItems:'flex-end', gap: isMobile ? 2 : 4, height: isMobile ? 80 : 120, marginTop:SP.md }}>
            {dayTotals.map((d, i) => {
              const total = d.common + d.perso
              const h = maxDayTotal > 0 ? (total / maxDayTotal * 100) : 0
              const commonH = total > 0 ? (d.common / total * h) : 0
              const persoH = total > 0 ? (d.perso / total * h) : 0
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ fontSize:'.6rem', color:'var(--text-muted)', fontWeight:600 }}>{total>0?fmt(total):''}</div>
                  <div style={{ width:'100%', display:'flex', flexDirection:'column-reverse', gap:1 }}>
                    {commonH > 0 && <div style={{ height:commonH+'%', minHeight:commonH>0?3:0, background:'var(--blue)', borderRadius:'4px 4px 0 0' }} />}
                    {persoH > 0 && <div style={{ height:persoH+'%', minHeight:persoH>0?3:0, background:'var(--green)', borderRadius: commonH>0?'0':'4px 4px 0 0' }} />}
                  </div>
                  <div style={{ fontSize:'.58rem', color:'var(--text-muted)' }}>{d.label}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:SP.lg, marginTop:SP.md, fontSize:'.7rem' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:'var(--blue)' }}/> Commun</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:'var(--green)' }}/> Perso</span>
          </div>
        </Card>

        {/* Donut categories */}
        <Card>
          <SectionLabel>Répartition par catégorie</SectionLabel>
          <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems:'center', gap: isMobile ? SP.md : SP.lg, marginTop:SP.sm }}>
            <DonutChart data={Object.entries(byCat)}.map(([cat,amt])=>({ value:amt, color:CAT_COLORS[cat]||'#888' }))} total={totalCommon} size={120} />
            <div style={{ flex:1 }}>
              {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
                <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', fontSize:'.78rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:SP.xs }}><div style={{ width:6, height:6, borderRadius:'50%', background:CAT_COLORS[cat]||'#888' }}/>{CAT_LABELS[cat]||cat}</div>
                  <span style={{ fontWeight:600 }}>{fmt(amt)} <span style={{ fontWeight:400, color:'var(--text-muted)', fontSize:'.7rem' }}>({totalCommon>0?Math.round(amt/totalCommon*100):0}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? SP.md : SP.lg }}>
        {/* Who spends the most */}
        <Card>
          <SectionLabel>Qui dépense le plus ?</SectionLabel>
          {voyageurs.map(v => {
            const amt = perPayer[v.id] || 0
            const maxPayer = Math.max(...Object.values(perPayer), 1)
            return (
              <div key={v.id} style={{ display:'flex', alignItems:'center', gap:SP.md, marginBottom:SP.sm }}>
                <Avatar name={v.name} size={26} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2, fontSize:'.8rem' }}>
                    <span style={{ fontWeight:500 }}>{v.name}</span>
                    <span style={{ fontWeight:600 }}>{fmt(amt)}</span>
                  </div>
                  <div style={{ height:6, background:'rgba(0,0,0,.04)', borderRadius:20, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:(amt/maxPayer*100)+'%', background:'var(--green)', borderRadius:20 }} />
                  </div>
                </div>
              </div>
            )
          })}
        </Card>

        {/* Common vs Perso split */}
        <Card>
          <SectionLabel>Commun vs Personnel</SectionLabel>
          <div style={{ display:'flex', alignItems:'center', gap:SP.lg, marginTop:SP.md }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', height:12, borderRadius:20, overflow:'hidden', gap:2 }}>
                <div style={{ flex:totalCommon||1, background:'var(--blue)', borderRadius:20 }} />
                <div style={{ flex:totalPerso||1, background:'var(--green)', borderRadius:20 }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:SP.sm }}>
                <div>
                  <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--blue)' }}>{fmt(totalCommon)}</div>
                  <div style={{ fontSize:'.68rem', color:'var(--text-muted)' }}>Commun ({totalAll>0?Math.round(totalCommon/totalAll*100):0}%)</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--green)' }}>{fmt(totalPerso)}</div>
                  <div style={{ fontSize:'.68rem', color:'var(--text-muted)' }}>Perso ({totalAll>0?Math.round(totalPerso/totalAll*100):0}%)</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN BUDGET COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function Budget({ trip, voyageurs, isGuest, activeVoyageurId, onUpdate }) {
  const [tab, setTab] = useState('vue')
  const isMobile = useIsMobile()
  const [showAdd, setShowAdd] = useState(false)

  const budget = trip.budget || 0
  const commonExpenses = trip.expenses || []
  const myVoyageurData = trip.voyageurData?.[activeVoyageurId] || {}
  const myPersonalExpenses = myVoyageurData.depenses || []
  const days = trip.days || []

  const totalCommon = commonExpenses.reduce((s,e)=>s+(parseFloat(e.amount)||0), 0)
  const totalPerso = myPersonalExpenses.reduce((s,e)=>s+(parseFloat(e.amount)||0), 0)
  const totalAll = totalCommon + totalPerso
  const pct = budget > 0 ? Math.round(totalAll / budget * 100) : 0
  const barColor = pct >= 100 ? '#E24B4A' : pct >= 80 ? '#EF9F27' : '#1D9E75'

  const { paid, owes, balances, debts } = calcBalances(commonExpenses, voyageurs)
  const byCat = {}
  commonExpenses.forEach(e => { byCat[e.category] = (byCat[e.category]||0) + (parseFloat(e.amount)||0) })

  const handleAdd = (expense) => {
    if (expense.type === 'common') {
      onUpdate({ expenses: [...commonExpenses, expense] })
    } else {
      const vd = trip.voyageurData || {}
      const myVd = vd[activeVoyageurId] || {}
      onUpdate({ voyageurData: { ...vd, [activeVoyageurId]: { ...myVd, depenses: [...(myVd.depenses||[]), expense] } } })
    }
  }
  const handleDeleteCommon = (id) => { if (confirm('Supprimer cette dépense ?')) onUpdate({ expenses: commonExpenses.filter(e=>e.id!==id) }) }
  const handleDeletePerso = (id) => {
    if (!confirm('Supprimer cette dépense ?')) return
    const vd = trip.voyageurData || {}; const myVd = vd[activeVoyageurId] || {}
    onUpdate({ voyageurData: { ...vd, [activeVoyageurId]: { ...myVd, depenses: (myVd.depenses||[]).filter(e=>e.id!==id) } } })
  }
  const handleSettle = (debt) => {
    const settle = { id:'exp_settle_'+Date.now(), label:`Remboursement ${debt.from.name} → ${debt.to.name}`, amount:debt.amount, category:'autre', type:'common', payerId:debt.from.id, participants:[debt.to.id], dayId:'', date:'', settled:true, createdAt:Date.now() }
    onUpdate({ expenses: [...commonExpenses, settle] })
  }

  const TABS = [['vue','Vue d\'ensemble'],['depenses','Dépenses'],['remb','Remboursements'],['stats','Statistiques']]

  return (
    <div>
      {/* Budget input (admin only) */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:SP.lg, flexWrap:'wrap', gap:SP.sm }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:SP.sm }}>
          <span style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>💰 Budget :</span>
          {!isGuest ? (
            <input type="number" defaultValue={budget||''} onBlur={e => onUpdate({ budget: parseFloat(e.target.value)||0 })}
              placeholder="Non défini" style={{ width:90, border:'none', borderBottom:'2px solid var(--border)', padding:'2px 0', fontSize:'1.1rem', fontWeight:700, fontFamily:'inherit', background:'transparent', outline:'none', color:'var(--text)' }} />
          ) : <span style={{ fontSize:'1.1rem', fontWeight:700 }}>{budget||'—'} €</span>}
        </div>
        {!isGuest && <button className="btn btn-primary" onClick={()=>setShowAdd(true)} style={{ borderRadius:R, padding:'8px 18px' }}>＋ Nouvelle dépense</button>}
      </div>

      {/* Tab bar — underline style */}
      <div style={{ display:'flex', borderBottom:'2px solid var(--border)', marginBottom:SP.lg, gap:0 }}>
        {TABS.map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            padding:`${SP.sm}px ${SP.lg}px`, border:'none', background:'none', cursor:'pointer', fontFamily:'inherit',
            fontSize:'.84rem', fontWeight: tab===id ? 600 : 400,
            color: tab===id ? 'var(--green)' : 'var(--text-muted)',
            borderBottom: tab===id ? '2px solid var(--green)' : '2px solid transparent',
            marginBottom: -2, transition:'all .15s'
          }}>{lbl}</button>
        ))}
      </div>

      {/* Content */}
      {tab === 'vue' && <VueEnsemble isMobile={isMobile} budget={budget} totalCommon={totalCommon} totalPerso={totalPerso} totalAll={totalAll} pct={pct} barColor={barColor} voyageurs={voyageurs} paid={paid} balances={balances} byCat={byCat} commonExpenses={commonExpenses} myPersonalExpenses={myPersonalExpenses} days={days} onShowAdd={()=>setShowAdd(true)} />}
      {tab === 'depenses' && <Depenses commonExpenses={commonExpenses} myPersonalExpenses={myPersonalExpenses} voyageurs={voyageurs} onDeleteCommon={handleDeleteCommon} onDeletePerso={handleDeletePerso} onShowAdd={()=>setShowAdd(true)} />}
      {tab === 'remb' && <Remboursements debts={debts} voyageurs={voyageurs} balances={balances} paid={paid} commonExpenses={commonExpenses} activeVoyageurId={activeVoyageurId} onSettle={handleSettle} isGuest={isGuest} />}
      {tab === 'stats' && <Statistiques isMobile={isMobile} totalCommon={totalCommon} totalPerso={totalPerso} totalAll={totalAll} voyageurs={voyageurs} paid={paid} byCat={byCat} commonExpenses={commonExpenses} myPersonalExpenses={myPersonalExpenses} days={days} budget={budget} />}

      {showAdd && <AddExpenseForm voyageurs={voyageurs} days={days} onAdd={handleAdd} onClose={()=>setShowAdd(false)} currentVoyageurId={activeVoyageurId} />}
    </div>
  )
}

import { useState, useEffect } from 'react'

export default function QRCode({ value, size = 160 }) {
  const [modules, setModules] = useState(null)
  useEffect(() => { if (value) setModules(generateQR(value)) }, [value])
  if (!modules) return null
  const n = modules.length
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: '#fff', padding: 6, display: 'inline-block' }}>
      <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`}>
        {modules.map((row, y) => row.map((v, x) => v ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000" /> : null))}
      </svg>
    </div>
  )
}

function generateQR(text) {
  const data = new TextEncoder().encode(text)
  const len = data.length
  const caps = [0,17,32,53,78,106,134,154,192,230,271]
  let ver = 1
  for (let v = 1; v <= 10; v++) { if (len <= caps[v]) { ver = v; break } }
  if (len > caps[10]) ver = 10

  const size = ver * 4 + 17
  const grid = Array.from({length: size}, () => Array(size).fill(null))
  const reserved = Array.from({length: size}, () => Array(size).fill(false))

  function finderPattern(row, col) {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = row+r, cc = col+c
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
      const isFinder = (r >= 0 && r <= 6 && c >= 0 && c <= 6) &&
        (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
      grid[rr][cc] = isFinder ? 1 : 0
      reserved[rr][cc] = true
    }
  }
  finderPattern(0, 0); finderPattern(0, size - 7); finderPattern(size - 7, 0)

  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0 ? 1 : 0; reserved[6][i] = true
    grid[i][6] = i % 2 === 0 ? 1 : 0; reserved[i][6] = true
  }
  grid[size - 8][8] = 1; reserved[size - 8][8] = true

  if (ver >= 2) {
    const pos = [6, size - 7]
    for (const r of pos) for (const c of pos) {
      if (reserved[r]?.[c]) continue
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const rr = r+dr, cc = c+dc
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
        grid[rr][cc] = (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) ? 1 : 0
        reserved[rr][cc] = true
      }
    }
  }

  for (let i = 0; i < 9; i++) {
    if (i < size) { reserved[8][i] = true; reserved[i][8] = true }
    if (size - 1 - i >= 0) { reserved[8][size-1-i] = true; reserved[size-1-i][8] = true }
  }

  const totalBits = caps[ver] * 8
  const bits = []
  const push = (val, len) => { for (let i = len-1; i >= 0; i--) bits.push((val >> i) & 1) }
  push(0b0100, 4)
  push(data.length, ver >= 10 ? 16 : 8)
  for (const b of data) push(b, 8)
  push(0, Math.min(4, totalBits - bits.length))
  while (bits.length % 8 !== 0) bits.push(0)
  const pads = [0b11101100, 0b00010001]
  let pi = 0
  while (bits.length < totalBits) { push(pads[pi % 2], 8); pi++ }

  let bitIdx = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((Math.floor((size - 1 - right) / 2)) % 2) === 0
        const y = upward ? size - 1 - vert : vert
        if (y < 0 || y >= size || x < 0 || x >= size) continue
        if (reserved[y][x]) continue
        grid[y][x] = bitIdx < bits.length ? bits[bitIdx] : 0
        bitIdx++
      }
    }
  }

  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!reserved[r][c]) grid[r][c] ^= ((r + c) % 2 === 0) ? 1 : 0
  }

  const formatBits = [1,1,1,0,1,1,1,1,1,0,0,0,1,0,0]
  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i]
    if (i < 6) grid[8][i] = bit
    else if (i < 8) grid[8][i + 1] = bit
    else if (i < 9) grid[8 - (i - 8)][8] = bit
    else grid[14 - i][8] = bit
    if (i < 8) grid[size - 1 - i][8] = bit
    else grid[8][size - 15 + i] = bit
  }

  return grid.map(row => row.map(v => v === 1 ? 1 : 0))
}

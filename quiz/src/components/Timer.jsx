import { useEffect, useRef, useState } from 'react'

function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// endAt: timestamp (ms) when the quiz attempt must end.
// onExpire: called once when time runs out.
export default function Timer({ endAt, onExpire }) {
  const [remaining, setRemaining] = useState(endAt - Date.now())
  const firedRef = useRef(false)

  useEffect(() => {
    const tick = () => {
      const r = endAt - Date.now()
      setRemaining(r)
      if (r <= 0 && !firedRef.current) {
        firedRef.current = true
        onExpire?.()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endAt, onExpire])

  const isLow = remaining <= 60_000
  const isCritical = remaining <= 15_000

  return (
    <div
      className="mono"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 16,
        fontWeight: 600,
        background: isCritical ? 'var(--danger-tint)' : isLow ? 'var(--accent-tint)' : 'var(--brand-tint)',
        color: isCritical ? 'var(--danger)' : isLow ? 'var(--accent)' : 'var(--brand-dark)',
        border: `1px solid ${isCritical ? 'var(--danger)' : 'transparent'}`,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
      {formatTime(remaining)}
    </div>
  )
}

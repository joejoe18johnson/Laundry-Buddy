import { useApp } from '../../context/AppContext'
import type { BookingStage } from '../../types'

const STAGES: { key: BookingStage; label: string; desc: string }[] = [
  { key: 'got-bag', label: 'Got bag', desc: 'Host received your laundry' },
  { key: 'waiting', label: 'Waiting', desc: 'Queued for the dryer' },
  { key: 'drying', label: 'Drying', desc: 'Your load is in the dryer' },
  { key: 'ready', label: 'Ready', desc: 'Pick up anytime' },
]

export function TrackingScreen() {
  const { booking, navigate } = useApp()

  if (!booking) {
    return (
      <div className="screen screen-empty">
        <p className="empty-title">No active booking</p>
        <p className="muted">Find a host to get started</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('customer-home')}>
          Explore dryers
        </button>
      </div>
    )
  }

  const stageIndex = STAGES.findIndex((s) => s.key === booking.stage)
  const current = STAGES[stageIndex]

  return (
    <div className="screen">
      <button type="button" className="back-btn" onClick={() => navigate('customer-home')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {booking.isNew && (
        <div className="success-banner">
          <div className="success-check">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <p className="success-title">Booking confirmed</p>
            <p className="success-sub">Drop off at {booking.address}</p>
          </div>
        </div>
      )}

      <header className="tracking-header">
        <p className="tracking-eyebrow">Your load</p>
        <h1>{current.label}</h1>
        <p className="tracking-sub">{current.desc} · with {booking.hostName}</p>
      </header>

      <ol className="timeline">
        {STAGES.map((stage, i) => {
          const done = i < stageIndex
          const active = i === stageIndex
          const time = booking.stageTimes[stage.key]

          return (
            <li key={stage.key} className={`timeline-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
              <div className="timeline-marker">
                <span className="timeline-dot" />
              </div>
              <div className="timeline-content">
                <span className="timeline-label">{stage.label}</span>
                {time && <span className="timeline-time">{time}</span>}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="info-card">
        <p>We'll notify you on WhatsApp when it's ready.</p>
      </div>

      <div className="pickup-card">
        <h3>Pickup details</h3>
        <dl className="detail-grid">
          <div>
            <dt>Address</dt>
            <dd>{booking.address}</dd>
          </div>
          <div>
            <dt>Gate code</dt>
            <dd>{booking.gateCode}</dd>
          </div>
        </dl>
        <a
          className="btn btn-outline btn-full"
          href={`https://wa.me/5016001234?text=Hi%20${booking.hostName}!%20Checking%20on%20my%20load.`}
          target="_blank"
          rel="noreferrer"
        >
          Message host
        </a>
      </div>
    </div>
  )
}

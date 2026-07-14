import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { DropOffTime, SheetsOption } from '../../types'

export function BookingScreen() {
  const { selectedHost, navigate, confirmBooking } = useApp()
  const [dropOffTime, setDropOffTime] = useState<DropOffTime>('2pm-4pm')
  const [loads, setLoads] = useState(1)
  const [sheetsOption, setSheetsOption] = useState<SheetsOption>('own')
  const [notes, setNotes] = useState('Please no high heat - gym clothes')

  if (!selectedHost) return null

  const times: { value: DropOffTime; label: string }[] = [
    { value: 'before-10', label: 'Before 10am' },
    { value: '2pm-4pm', label: '2pm – 4pm' },
    { value: 'after-4', label: 'After 4pm' },
  ]

  const sheets: { value: SheetsOption; label: string; sub?: string }[] = [
    { value: 'own', label: "I'll bring my own" },
    { value: 'buy', label: 'Buy from host', sub: '$1' },
    { value: 'none', label: 'No sheets' },
  ]

  return (
    <div className="screen screen-booking">
      <button type="button" className="back-btn" onClick={() => navigate('customer-home')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <header className="booking-header">
        <p className="booking-eyebrow">{selectedHost.location}</p>
        <h1>Book with {selectedHost.name}</h1>
      </header>

      <section className="form-section">
        <h2>Drop-off time</h2>
        <div className="chip-group">
          {times.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`chip ${dropOffTime === t.value ? 'selected' : ''}`}
              onClick={() => setDropOffTime(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h2>Loads</h2>
        <div className="stepper">
          <button type="button" className="stepper-btn" onClick={() => setLoads(Math.max(1, loads - 1))} aria-label="Decrease">
            −
          </button>
          <div className="stepper-value">
            <span className="stepper-count">{loads}</span>
            <span className="stepper-label">standard basket{loads > 1 ? 's' : ''}</span>
          </div>
          <button type="button" className="stepper-btn" onClick={() => setLoads(loads + 1)} aria-label="Increase">
            +
          </button>
        </div>
      </section>

      <section className="form-section">
        <h2>Dryer sheets</h2>
        <div className="option-list">
          {sheets.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`option-row ${sheetsOption === s.value ? 'selected' : ''}`}
              onClick={() => setSheetsOption(s.value)}
            >
              <span className="option-radio" />
              <span className="option-text">
                {s.label}
                {s.sub && <small>{s.sub}</small>}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h2>Special notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any special instructions..."
        />
      </section>

      <div className="sticky-footer">
        <div className="sticky-footer-info">
          <span className="price">Free</span>
          <span className="price-sub">No payment required</span>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => confirmBooking({ dropOffTime, loads, sheetsOption, notes })}
        >
          Confirm booking
        </button>
      </div>
    </div>
  )
}

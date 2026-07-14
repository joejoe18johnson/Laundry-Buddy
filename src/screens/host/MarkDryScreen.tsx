import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export function MarkDryScreen() {
  const { activeLoad, navigate, markDry } = useApp()
  const [photoTaken, setPhotoTaken] = useState(false)

  if (!activeLoad) {
    return (
      <div className="screen screen-empty">
        <p className="empty-title">No active load</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('host-dashboard')}>
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="screen">
      <button type="button" className="back-btn" onClick={() => navigate('host-dashboard')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <header className="booking-header">
        <p className="booking-eyebrow">Active load</p>
        <h1>{activeLoad.customerName}'s laundry</h1>
      </header>

      <section className="mark-dry-section">
        <h2>Confirm it's dry</h2>
        <p className="muted">Take a photo so the customer can trust it's ready.</p>

        <button
          type="button"
          className={`photo-upload ${photoTaken ? 'taken' : ''}`}
          onClick={() => setPhotoTaken(true)}
        >
          {photoTaken ? (
            <>
              <div className="photo-preview-thumb" />
              <span>Photo added</span>
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Add photo</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-primary btn-full"
          disabled={!photoTaken}
          onClick={markDry}
        >
          Mark as dry
        </button>

        <p className="notify-preview">
          Sends: "Your load is dry! Ready for pickup."
        </p>
      </section>
    </div>
  )
}

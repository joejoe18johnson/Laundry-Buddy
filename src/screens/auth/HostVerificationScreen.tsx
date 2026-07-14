import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'

export function HostVerificationScreen() {
  const { user, submitHostVerification, logout } = useAuth()
  const [address, setAddress] = useState('')
  const [idUploaded, setIdUploaded] = useState(false)
  const [addressUploaded, setAddressUploaded] = useState(false)

  if (!user) return null

  const status = user.hostVerification?.status ?? 'none'
  const isPending = status === 'pending'
  const isRejected = status === 'rejected'

  const canSubmit = address.trim().length > 0 && idUploaded && addressUploaded && !isPending

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    submitHostVerification({ address, idUploaded, addressUploaded })
  }

  if (isPending) {
    return (
      <div className="auth-screen">
        <header className="auth-header">
          <span className="status-pill pending">Under review</span>
          <h1>Verification submitted</h1>
          <p className="muted">
            We're reviewing your ID and address proof. This usually takes 24 hours. We'll notify you when you're approved.
          </p>
        </header>

        <div className="verification-checklist">
          <div className="check-item done">
            <span className="check-icon">✓</span>
            <div>
              <strong>Government ID</strong>
              <p className="muted">Uploaded</p>
            </div>
          </div>
          <div className="check-item done">
            <span className="check-icon">✓</span>
            <div>
              <strong>Address proof</strong>
              <p className="muted">{user.hostVerification?.address}</p>
            </div>
          </div>
        </div>

        <button type="button" className="btn btn-ghost btn-full" onClick={logout}>
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <header className="auth-header">
        <span className="status-pill">Host verification</span>
        <h1>Verify your identity</h1>
        <p className="muted">
          {isRejected
            ? 'Your previous submission was rejected. Please resubmit clear documents.'
            : 'Upload your ID and proof of address so guests can trust your listing.'}
        </p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <section className="verify-section">
          <h2>Government ID</h2>
          <p className="muted small">Passport, social security card, or driver's license</p>
          <button
            type="button"
            className={`upload-card ${idUploaded ? 'done' : ''}`}
            onClick={() => setIdUploaded(true)}
          >
            {idUploaded ? (
              <>
                <span className="upload-check">✓</span>
                <span>ID uploaded</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="11" r="2" />
                  <path d="M15 9h2M15 13h2" />
                </svg>
                <span>Upload ID photo</span>
              </>
            )}
          </button>
        </section>

        <section className="verify-section">
          <h2>Home address</h2>
          <label className="field">
            <span>Street address</span>
            <input
              type="text"
              placeholder="22 Coconut St., Las Flores"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </label>

          <p className="muted small">Proof of address — utility bill or lease in your name</p>
          <button
            type="button"
            className={`upload-card ${addressUploaded ? 'done' : ''}`}
            onClick={() => setAddressUploaded(true)}
          >
            {addressUploaded ? (
              <>
                <span className="upload-check">✓</span>
                <span>Address proof uploaded</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
                <span>Upload address proof</span>
              </>
            )}
          </button>
        </section>

        <button type="submit" className="btn btn-primary btn-full" disabled={!canSubmit}>
          Submit for review
        </button>

        <button type="button" className="btn btn-ghost btn-full" onClick={logout}>
          Log out
        </button>
      </form>
    </div>
  )
}

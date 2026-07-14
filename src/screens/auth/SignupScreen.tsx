import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import type { AppRole, LoginMethod } from '../../types'

export function SignupScreen() {
  const { signup, navigateAuth, authError, clearAuthError } = useAuth()
  const [method, setMethod] = useState<LoginMethod>('phone')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('customer')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    clearAuthError()
    signup({
      name,
      method,
      phone: method === 'phone' ? phone : undefined,
      email: method === 'email' ? email : undefined,
      password,
      role,
    })
  }

  return (
    <div className="auth-screen">
      <button type="button" className="back-btn" onClick={() => navigateAuth('welcome')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <header className="auth-header">
        <h1>Create account</h1>
        <p className="muted">Join as a guest or host your dryer</p>
      </header>

      <div className="role-picker">
        <button
          type="button"
          className={`role-card ${role === 'customer' ? 'selected' : ''}`}
          onClick={() => setRole('customer')}
        >
          <strong>I need a dryer</strong>
          <span>Book loads near you</span>
        </button>
        <button
          type="button"
          className={`role-card ${role === 'host' ? 'selected' : ''}`}
          onClick={() => setRole('host')}
        >
          <strong>I have a dryer</strong>
          <span>Host & help neighbors</span>
        </button>
      </div>

      {role === 'host' && (
        <div className="info-card auth-notice">
          <p>Hosts must verify their ID and address before accepting loads.</p>
        </div>
      )}

      <div className="method-tabs">
        <button
          type="button"
          className={method === 'phone' ? 'active' : ''}
          onClick={() => { setMethod('phone'); clearAuthError() }}
        >
          Phone
        </button>
        <button
          type="button"
          className={method === 'email' ? 'active' : ''}
          onClick={() => { setMethod('email'); clearAuthError() }}
        >
          Email
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Full name</span>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        {method === 'phone' ? (
          <label className="field">
            <span>Phone number</span>
            <div className="phone-input">
              <span className="phone-prefix">+501</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="600 1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </label>
        ) : (
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        )}

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {authError && <p className="auth-error">{authError}</p>}

        <button type="submit" className="btn btn-primary btn-full">
          {role === 'host' ? 'Continue to verification' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" className="link-btn" onClick={() => navigateAuth('login')}>
          Log in
        </button>
      </p>
    </div>
  )
}

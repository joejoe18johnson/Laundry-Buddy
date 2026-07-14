import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import type { LoginMethod } from '../../types'

export function LoginScreen() {
  const { login, navigateAuth, authError, clearAuthError } = useAuth()
  const [method, setMethod] = useState<LoginMethod>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    clearAuthError()
    login(method, method === 'phone' ? phone : email, password)
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
        <h1>Welcome back</h1>
        <p className="muted">Log in with your phone or email</p>
      </header>

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
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {authError && <p className="auth-error">{authError}</p>}

        <button type="submit" className="btn btn-primary btn-full">
          Log in
        </button>
      </form>

      <p className="auth-switch">
        New here?{' '}
        <button type="button" className="link-btn" onClick={() => navigateAuth('signup')}>
          Create account
        </button>
      </p>
    </div>
  )
}

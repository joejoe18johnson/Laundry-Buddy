import { useAuth } from '../../context/AuthContext'

export function WelcomeScreen() {
  const { navigateAuth } = useAuth()

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <p className="auth-logo">Laundry Buddy</p>
        <h1>Dry laundry, rain or shine</h1>
        <p className="auth-tagline">Book a neighbor's dryer in Belmopan — free for the community.</p>
      </div>

      <div className="auth-actions">
        <button type="button" className="btn btn-primary btn-full" onClick={() => navigateAuth('login')}>
          Log in
        </button>
        <button type="button" className="btn btn-outline btn-full" onClick={() => navigateAuth('signup')}>
          Create account
        </button>
      </div>

      <p className="auth-demo-hint">
        Demo: phone <strong>6001111</strong> or email <strong>maria@example.com</strong> · password <strong>demo1234</strong>
      </p>
    </div>
  )
}

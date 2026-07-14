import { useApp } from '../context/AppContext'

export function RoleSwitch() {
  const { role, setRole } = useApp()

  return (
    <div className="role-switch" role="tablist" aria-label="App mode">
      <button
        type="button"
        role="tab"
        aria-selected={role === 'customer'}
        className={role === 'customer' ? 'active' : ''}
        onClick={() => setRole('customer')}
      >
        Guest
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={role === 'host'}
        className={role === 'host' ? 'active' : ''}
        onClick={() => setRole('host')}
      >
        Host
      </button>
    </div>
  )
}

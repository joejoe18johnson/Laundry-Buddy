import { DROP_OFF_LABELS, SHEETS_LABELS } from '../../types'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

export function DashboardScreen() {
  const { user } = useAuth()
  const { hostRequest, activeLoad, navigate, acceptRequest, declineRequest, advanceStage } =
    useApp()

  return (
    <div className="screen">
      <header className="host-header">
        <div className="host-header-top">
          <h1>{user?.name}'s dryer</h1>
          <span className="status-pill live">Accepting</span>
        </div>
        <p className="host-stats">2 of 4 loads today</p>
        <p className="community-msg">Free bookings — you're helping the community.</p>
      </header>

      {hostRequest && (
        <section className="host-section">
          <h2 className="section-label">New request</h2>
          <div className="request-card">
            <div className="request-header">
              <span className="request-avatar">{hostRequest.customerName[0]}</span>
              <div>
                <p className="request-title">{hostRequest.customerName}</p>
                <p className="request-meta">{hostRequest.location} · {hostRequest.loads} load</p>
              </div>
            </div>
            <div className="request-details">
              <span className="tag">{DROP_OFF_LABELS[hostRequest.dropOffTime]}</span>
              <span className="tag">{SHEETS_LABELS[hostRequest.sheetsOption]}</span>
            </div>
            <div className="request-actions">
              <button type="button" className="btn btn-primary" onClick={acceptRequest}>
                Accept
              </button>
              <button type="button" className="btn btn-ghost" onClick={declineRequest}>
                Decline
              </button>
            </div>
          </div>
        </section>
      )}

      {activeLoad && (
        <section className="host-section">
          <h2 className="section-label">Active load</h2>
          <div className="active-load-card">
            <div className="request-header">
              <span className="request-avatar">{activeLoad.customerName[0]}</span>
              <div>
                <p className="request-title">{activeLoad.customerName}</p>
                <p className="request-meta">{activeLoad.loads} load · {activeLoad.stage.replace('-', ' ')}</p>
              </div>
            </div>
            <div className="host-action-stack">
              {(activeLoad.stage === 'got-bag' || activeLoad.stage === 'waiting') && (
                <button
                  type="button"
                  className="btn btn-primary btn-full"
                  onClick={() => advanceStage('drying')}
                >
                  Start dryer
                </button>
              )}
              {activeLoad.stage === 'drying' && (
                <button
                  type="button"
                  className="btn btn-primary btn-full"
                  onClick={() => navigate('host-mark-dry')}
                >
                  Mark as dry
                </button>
              )}
              {activeLoad.stage === 'ready' && (
                <p className="success-inline">Load complete — customer notified</p>
              )}
            </div>
          </div>
        </section>
      )}

      {!hostRequest && !activeLoad && (
        <div className="empty-state">
          <p className="empty-title">All caught up</p>
          <p className="muted">No pending requests right now</p>
        </div>
      )}
    </div>
  )
}

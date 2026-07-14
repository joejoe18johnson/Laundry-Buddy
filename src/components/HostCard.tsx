import { useState } from 'react'
import type { Host } from '../types'
import { useApp } from '../context/AppContext'

const COVER_GRADIENTS: Record<string, string> = {
  maria: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  lopez: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
}

interface HostCardProps {
  host: Host
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function HostCard({ host }: HostCardProps) {
  const { selectHost } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [showGeneratorInfo, setShowGeneratorInfo] = useState(false)

  return (
    <article className="host-card">
      <button
        type="button"
        className="host-card-cover"
        style={{ background: COVER_GRADIENTS[host.id] }}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className="host-card-badge">Free</span>
      </button>

      <div className="host-card-body">
        <button
          type="button"
          className="host-card-main"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          <div className="host-card-row">
            <h3 className="host-title">{host.location}</h3>
            <span className="host-rating">
              <StarIcon />
              {host.rating.toFixed(1)}
            </span>
          </div>
          <p className="host-subtitle">Hosted by {host.name}</p>
          <p className="host-meta">
            {host.slotsLeft} slots today · ~{host.turnaroundHours} hr turnaround · {host.dryerType}
          </p>
          <div className="host-tags">
            {host.hasGenerator && (
              <button
                type="button"
                className="tag tag-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowGeneratorInfo(true)
                }}
              >
                Generator
              </button>
            )}
            {host.foldingExtra != null && (
              <span className="tag">Folding +${host.foldingExtra}</span>
            )}
          </div>
        </button>

        {expanded && (
          <div className="host-expanded">
            <div className="expanded-block">
              <p className="expanded-label">Setup</p>
              <ul className="detail-list">
                {host.photos.map((photo) => (
                  <li key={photo}>{photo}</li>
                ))}
              </ul>
            </div>
            <div className="expanded-block">
              <p className="expanded-label">House rules</p>
              <ul className="detail-list">
                {host.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <button type="button" className="btn btn-primary btn-full" onClick={() => selectHost(host)}>
          Book slot
        </button>
      </div>

      {showGeneratorInfo && (
        <div className="modal-overlay" onClick={() => setShowGeneratorInfo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h3>Generator backup</h3>
            <p>Works during BEL power outages — your load keeps drying when the grid goes down.</p>
            <button type="button" className="btn btn-primary btn-full" onClick={() => setShowGeneratorInfo(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

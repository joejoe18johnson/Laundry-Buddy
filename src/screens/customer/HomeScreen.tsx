import { WeatherBanner } from '../../components/WeatherBanner'
import { HostCard } from '../../components/HostCard'
import { HOSTS } from '../../data/mockData'
import { useApp } from '../../context/AppContext'

export function HomeScreen() {
  const { showMap, setShowMap } = useApp()

  return (
    <div className="screen">
      <header className="screen-hero">
        <h1>Find a dryer near you</h1>
        <p className="screen-subtitle">Free community drying in Belmopan</p>
      </header>

      <WeatherBanner />

      <div className="toolbar">
        <button type="button" className="toolbar-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          Filters
        </button>
        <button type="button" className="toolbar-btn" onClick={() => setShowMap(!showMap)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {showMap ? 'List' : 'Map'}
        </button>
      </div>

      {showMap ? (
        <div className="map-placeholder">
          <div className="map-grid" />
          <div className="map-pin map-pin-1">
            <span>Maria</span>
            <small>0.8 km</small>
          </div>
          <div className="map-pin map-pin-2">
            <span>Mr. Lopez</span>
            <small>1.2 km</small>
          </div>
        </div>
      ) : (
        <div className="host-list">
          {HOSTS.map((host) => (
            <HostCard key={host.id} host={host} />
          ))}
        </div>
      )}
    </div>
  )
}

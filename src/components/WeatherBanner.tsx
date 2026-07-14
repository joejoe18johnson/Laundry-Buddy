import { WEATHER } from '../data/mockData'

export function WeatherBanner() {
  return (
    <div className="weather-banner">
      <div className="weather-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          <path d="M8 13a4 4 0 1 1 8 0 3 3 0 0 1-6 0z" />
        </svg>
      </div>
      <div>
        <p className="weather-headline">{WEATHER.headline}</p>
        <p className="weather-detail">{WEATHER.detail}</p>
      </div>
    </div>
  )
}

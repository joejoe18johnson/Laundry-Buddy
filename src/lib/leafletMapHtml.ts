import type { Coordinates } from './geo'
import type { Host } from '../types'

const CORE = 42
const HALO = 56

export function buildLeafletMapHtml(
  hosts: Host[],
  userLocation: Coordinates,
  radiusKm: number,
  fitToResults = false,
): string {
  const payload = JSON.stringify(
    hosts.map((h) => ({
      id: h.id,
      lat: h.latitude,
      lng: h.longitude,
      price: h.price,
      name: h.name,
    })),
  )

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #e9ecef; }

    /* Reset Leaflet divIcon defaults that stretch markers into pills */
    .leaflet-div-icon {
      background: transparent !important;
      border: none !important;
    }
    .host-marker-icon {
      background: transparent !important;
      border: none !important;
    }

    .marker-wrap {
      width: ${HALO}px;
      height: ${HALO}px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    }

    .marker-pulse {
      position: absolute;
      width: ${CORE}px;
      height: ${CORE}px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.16);
      animation: marker-pulse 2.4s ease-out infinite;
      will-change: transform, opacity;
    }

    .marker-core {
      position: relative;
      z-index: 2;
      width: ${CORE}px;
      height: ${CORE}px;
      min-width: ${CORE}px;
      min-height: ${CORE}px;
      max-width: ${CORE}px;
      max-height: ${CORE}px;
      border-radius: 50%;
      background: #000000;
      color: #ffffff;
      border: 3px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.3px;
      text-align: center;
      white-space: nowrap;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
      overflow: hidden;
    }

    .marker-core.free {
      font-size: 10px;
      letter-spacing: 0;
    }

    @keyframes marker-pulse {
      0% {
        transform: scale(0.82);
        opacity: 0.42;
      }
      65% {
        transform: scale(1.48);
        opacity: 0;
      }
      100% {
        transform: scale(1.48);
        opacity: 0;
      }
    }

    .you-wrap {
      width: 40px;
      height: 40px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .you-pulse {
      position: absolute;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(39, 110, 241, 0.35);
      animation: you-pulse 2.2s ease-out infinite;
    }

    .you-core {
      position: relative;
      z-index: 2;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #276ef1;
      border: 3px solid #ffffff;
      box-shadow: 0 1px 6px rgba(39, 110, 241, 0.45);
    }

    @keyframes you-pulse {
      0% { transform: scale(0.8); opacity: 0.5; }
      70% { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    .leaflet-control-attribution { font-size: 9px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const hosts = ${payload};
    const you = { lat: ${userLocation.latitude}, lng: ${userLocation.longitude} };
    const radiusM = ${radiusKm * 1000};
    const HALO = ${HALO};
    const fitToResults = ${fitToResults ? 'true' : 'false'};

    function hostMarkerHtml(label, isFree) {
      return '<div class="marker-wrap">' +
        '<div class="marker-pulse"></div>' +
        '<div class="marker-core' + (isFree ? ' free' : '') + '">' + label + '</div>' +
      '</div>';
    }

    const map = L.map('map', { zoomControl: true, attributionControl: true });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const searchCircle = L.circle([you.lat, you.lng], {
      radius: radiusM,
      color: '#000000',
      weight: 1.5,
      opacity: 0.55,
      fillColor: '#000000',
      fillOpacity: 0.06,
      dashArray: '7 6'
    }).addTo(map);

    const youIcon = L.divIcon({
      html: '<div class="you-wrap"><div class="you-pulse"></div><div class="you-core"></div></div>',
      className: 'host-marker-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    L.marker([you.lat, you.lng], { icon: youIcon, zIndexOffset: 1000 }).addTo(map);

    hosts.forEach(function(h) {
      const isFree = h.price <= 0;
      const label = isFree ? 'Free' : ('$' + h.price);
      const icon = L.divIcon({
        html: hostMarkerHtml(label, isFree),
        className: 'host-marker-icon',
        iconSize: [HALO, HALO],
        iconAnchor: [HALO / 2, HALO / 2]
      });
      const marker = L.marker([h.lat, h.lng], { icon: icon }).addTo(map);
      marker.on('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'host', hostId: h.id }));
        }
      });
    });

    if (fitToResults && hosts.length > 0) {
      const bounds = L.latLngBounds([[you.lat, you.lng]]);
      hosts.forEach(function(h) { bounds.extend([h.lat, h.lng]); });
      map.fitBounds(bounds, { padding: [52, 52], maxZoom: 14 });
    } else {
      map.fitBounds(searchCircle.getBounds(), { padding: [48, 48], maxZoom: 13 });
    }

    setTimeout(function() { map.invalidateSize(); }, 250);
    window.addEventListener('resize', function() { map.invalidateSize(); });
  </script>
</body>
</html>`
}

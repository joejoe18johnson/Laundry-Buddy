import type { Coordinates } from './geo'
import type { Host } from '../types'

export function buildLeafletMapHtml(
  hosts: Host[],
  userLocation: Coordinates,
  radiusKm: number,
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
    .pin {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #000;
      color: #fff;
      font: 700 11px -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.22);
      border: 2.5px solid #fff;
    }
    .pin-free { font-size: 9px; font-weight: 800; }
    .you {
      width: 14px;
      height: 14px;
      background: #276ef1;
      border: 2.5px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(39,110,241,0.22);
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

    const map = L.map('map', { zoomControl: true, attributionControl: true })
      .setView([you.lat, you.lng], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    L.circle([you.lat, you.lng], {
      radius: radiusM,
      color: '#000000',
      weight: 1.5,
      opacity: 0.55,
      fillColor: '#000000',
      fillOpacity: 0.06,
      dashArray: '7 6'
    }).addTo(map);

    const youIcon = L.divIcon({
      html: '<div class="you"></div>',
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    L.marker([you.lat, you.lng], { icon: youIcon, zIndexOffset: 1000 }).addTo(map);

    hosts.forEach(function(h) {
      const label = h.price <= 0 ? 'Free' : ('$' + h.price);
      const freeClass = h.price <= 0 ? ' pin-free' : '';
      const icon = L.divIcon({
        html: '<div class="pin' + freeClass + '">' + label + '</div>',
        className: '',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });
      const marker = L.marker([h.lat, h.lng], { icon: icon }).addTo(map);
      marker.on('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'host', hostId: h.id }));
        }
      });
    });

    setTimeout(function() { map.invalidateSize(); }, 250);
    window.addEventListener('resize', function() { map.invalidateSize(); });
  </script>
</body>
</html>`
}

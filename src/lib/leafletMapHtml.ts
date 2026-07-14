import { USER_LOCATION } from './mapRegion'
import type { Host } from '../types'

export function buildLeafletMapHtml(hosts: Host[]): string {
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
      background: #000;
      color: #fff;
      padding: 6px 10px;
      border-radius: 999px;
      font: 700 12px -apple-system, BlinkMacSystemFont, sans-serif;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    }
    .you {
      width: 12px;
      height: 12px;
      background: #276ef1;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(39,110,241,0.25);
    }
    .leaflet-control-attribution { font-size: 9px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const hosts = ${payload};
    const you = { lat: ${USER_LOCATION.latitude}, lng: ${USER_LOCATION.longitude} };

    const map = L.map('map', { zoomControl: true, attributionControl: true })
      .setView([you.lat, you.lng], 12);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const youIcon = L.divIcon({
      html: '<div class="you"></div>',
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    L.marker([you.lat, you.lng], { icon: youIcon }).addTo(map);

    const markers = [];
    hosts.forEach(function(h) {
      const label = h.price <= 0 ? 'Free' : ('$' + h.price);
      const icon = L.divIcon({
        html: '<div class="pin">' + label + '</div>',
        className: '',
        iconAnchor: [24, 32]
      });
      const marker = L.marker([h.lat, h.lng], { icon: icon }).addTo(map);
      marker.on('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'host', hostId: h.id }));
        }
      });
      markers.push(marker);
    });

    markers.push(L.marker([you.lat, you.lng]));
    if (markers.length > 1) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.18));
    }

    setTimeout(function() { map.invalidateSize(); }, 250);
    window.addEventListener('resize', function() { map.invalidateSize(); });
  </script>
</body>
</html>`
}

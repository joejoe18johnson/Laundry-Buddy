import type { Coordinates } from './geo'
import { circleRing } from './geo'
import { OPENFREEMAP_STYLE_URL } from './mapRegion'

const CORE = 42
const HALO = 56

export type MapHostPin = {
  id: string
  lat: number
  lng: number
  price: number
  name: string
  inRadius: boolean
  unavailable?: boolean
}

export function buildLeafletMapHtml(
  hostPins: MapHostPin[],
  userLocation: Coordinates,
  radiusKm: number,
  fitToResults = false,
  fitCoords?: { lat: number; lng: number }[],
): string {
  const payload = JSON.stringify(hostPins)
  const fitPayload = JSON.stringify(
    fitCoords ?? hostPins.map((h) => ({ lat: h.lat, lng: h.lng })),
  )
  const circleCoords = JSON.stringify(circleRing(userLocation, radiusKm))

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" crossorigin="" />
  <script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #f2f3f0; }

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

    .marker-pulse-white {
      position: absolute;
      width: ${CORE}px;
      height: ${CORE}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.92);
      border: 2px solid #ffffff;
      animation: marker-pulse-white 2s ease-out infinite;
      will-change: transform, opacity;
    }

    .marker-wrap.distant {
      opacity: 0.72;
    }

    .marker-wrap.distant .marker-pulse,
    .marker-wrap.distant .marker-pulse-white {
      display: none;
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

    .marker-core.distant {
      width: 34px;
      height: 34px;
      min-width: 34px;
      min-height: 34px;
      max-width: 34px;
      max-height: 34px;
      background: #9ca3af;
      border-color: #e5e7eb;
      border-width: 2px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.14);
    }

    .marker-core.distant.free {
      font-size: 9px;
    }

    @keyframes marker-pulse {
      0% { transform: scale(0.82); opacity: 0.42; }
      65% { transform: scale(1.48); opacity: 0; }
      100% { transform: scale(1.48); opacity: 0; }
    }

    @keyframes marker-pulse-white {
      0% { transform: scale(0.88); opacity: 0.55; }
      65% { transform: scale(1.62); opacity: 0; }
      100% { transform: scale(1.62); opacity: 0; }
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

    .maplibregl-ctrl-attrib { font-size: 9px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const hosts = ${payload};
    const fitHosts = ${fitPayload};
    let you = { lat: ${userLocation.latitude}, lng: ${userLocation.longitude} };
    let radiusM = ${radiusKm * 1000};
    const circleRing = ${circleCoords};
    const HALO = ${HALO};
    const HALO_DISTANT = 44;
    const fitToResults = ${fitToResults ? 'true' : 'false'};

    function hostMarkerHtml(label, isFree, inRadius) {
      const wrapClass = inRadius ? 'marker-wrap nearby' : 'marker-wrap distant';
      const coreClass = 'marker-core' + (isFree ? ' free' : '') + (inRadius ? '' : ' distant');
      const pulseHtml = inRadius
        ? '<div class="marker-pulse-white"></div><div class="marker-pulse"></div>'
        : '';
      const halo = inRadius ? HALO : HALO_DISTANT;
      return '<div class="' + wrapClass + '" style="width:' + halo + 'px;height:' + halo + 'px">' +
        pulseHtml +
        '<div class="' + coreClass + '">' + label + '</div>' +
      '</div>';
    }

    function zoomForRadiusM(radiusMeters) {
      if (radiusMeters >= 25000) return 10;
      if (radiusMeters >= 15000) return 11;
      if (radiusMeters >= 8000) return 12;
      if (radiusMeters >= 3000) return 13;
      return 14;
    }

    let hostMarkers = [];
    let youMarker = null;

    const map = new maplibregl.Map({
      container: 'map',
      style: '${OPENFREEMAP_STYLE_URL}',
      center: [you.lng, you.lat],
      zoom: zoomForRadiusM(radiusM),
      pitch: 0,
      bearing: 0,
      attributionControl: true
    });

    function addRadiusLayers() {
      if (map.getSource('radius-circle')) {
        map.getSource('radius-circle').setData({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [circleRing] },
          properties: {}
        });
        return;
      }
      map.addSource('radius-circle', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [circleRing] },
          properties: {}
        }
      });
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: { 'fill-color': '#000000', 'fill-opacity': 0.06 }
      });
      map.addLayer({
        id: 'radius-line',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': '#000000',
          'line-width': 1.5,
          'line-opacity': 0.55,
          'line-dasharray': [2, 2]
        }
      });
    }

    function clearHostMarkers() {
      hostMarkers.forEach(function(marker) { marker.remove(); });
      hostMarkers = [];
    }

    function addHostMarkers(hostList) {
      clearHostMarkers();
      hostList.forEach(function(h) {
        const isFree = !h.unavailable && h.price <= 0;
        const label = h.unavailable ? '—' : (isFree ? 'Free' : ('$' + h.price));
        const el = document.createElement('div');
        el.innerHTML = hostMarkerHtml(label, isFree, h.inRadius);
        el.style.cursor = 'pointer';
        el.addEventListener('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'host', hostId: h.id }));
          }
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([h.lng, h.lat])
          .addTo(map);
        hostMarkers.push(marker);
      });
    }

    function addYouMarker() {
      if (youMarker) youMarker.remove();
      const el = document.createElement('div');
      el.innerHTML = '<div class="you-wrap"><div class="you-pulse"></div><div class="you-core"></div></div>';
      youMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([you.lng, you.lat])
        .addTo(map);
    }

    function fitSearchArea() {
      const bounds = new maplibregl.LngLatBounds();
      circleRing.forEach(function(coord) { bounds.extend(coord); });
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 400 });
    }

    function fitHostResults(hostCoords) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([you.lng, you.lat]);
      hostCoords.forEach(function(h) { bounds.extend([h.lng, h.lat]); });
      map.fitBounds(bounds, { padding: 52, maxZoom: 14, duration: 400 });
    }

    map.on('load', function() {
      addRadiusLayers();
      addYouMarker();
      addHostMarkers(hosts);
      if (fitToResults && fitHosts.length > 0) {
        fitHostResults(fitHosts);
      } else {
        fitSearchArea();
      }
    });

    window.__lbUpdateHosts = function(nextHosts, nextFitHosts, shouldFitResults) {
      addHostMarkers(nextHosts);
      if (shouldFitResults && nextFitHosts.length > 0) {
        fitHostResults(nextFitHosts);
      }
    };

    window.__lbRecenterSearch = function(lat, lng, nextRadiusM) {
      you.lat = lat;
      you.lng = lng;
      radiusM = nextRadiusM;
      map.setCenter([lng, lat]);
      addYouMarker();
      fitSearchArea();
    };

    window.addEventListener('resize', function() { map.resize(); });
  </script>
</body>
</html>`
}

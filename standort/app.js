const statusEl = document.getElementById('status');
const toggleBtn = document.getElementById('toggleTracking');
let map = L.map('map').setView([51.1657, 10.4515], 6); // Deutschland default
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker = null;
let circle = null;
let watchId = null;

function onPosition(pos) {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  const acc = pos.coords.accuracy;
  const time = new Date(pos.timestamp).toLocaleTimeString();

  statusEl.textContent = `Position aktualisiert: ${lat.toFixed(6)}, ${lon.toFixed(6)} (±${Math.round(acc)} m) um ${time}`;

  if (!marker) {
    marker = L.marker([lat, lon]).addTo(map).bindPopup('Du bist hier');
  } else {
    marker.setLatLng([lat, lon]);
  }

  if (!circle) {
    circle = L.circle([lat, lon], { radius: acc, color: '#136AEC', fillColor: '#136AEC', fillOpacity: 0.15 }).addTo(map);
  } else {
    circle.setLatLng([lat, lon]).setRadius(acc);
  }

  map.setView([lat, lon], 16);
}

function onError(err) {
  statusEl.textContent = `Fehler: ${err.message}`;
}

function startTracking() {
  if (!('geolocation' in navigator)) {
    alert('Geolocation wird von deinem Browser nicht unterstützt.');
    return;
  }
  statusEl.textContent = 'Standort wird ermittelt...';
  watchId = navigator.geolocation.watchPosition(onPosition, onError, { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 });
  toggleBtn.textContent = 'Tracking stoppen';
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    statusEl.textContent = 'Tracking gestoppt.';
    toggleBtn.textContent = 'Standort anzeigen';
  }
}

toggleBtn.addEventListener('click', () => {
  if (watchId === null) startTracking(); else stopTracking();
});

// Optional: versuche beim Laden automatisch zu starten (ohne Klick einige Browser blocken dies)
window.addEventListener('load', () => {
  // Keine automatische Erlaubnis-Anforderung wenn Nutzer nicht interagiert; Button bleibt zur Verfügung
});
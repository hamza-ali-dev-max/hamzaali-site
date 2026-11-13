// The map: Leaflet with OpenStreetMap tiles. Loaded only when the map scrolls into view.
import L from 'leaflet';

const CITIES = [
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, home: true },
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
  { name: 'Pretoria', lat: -25.7479, lng: 28.2293 },
  { name: 'Durban', lat: -29.8587, lng: 31.0218 },
  { name: 'Gqeberha', lat: -33.9608, lng: 25.6022 },
  { name: 'Bloemfontein', lat: -29.0852, lng: 26.1596 },
];

export function createMap(element, text) {
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const map = L.map(element, {
    scrollWheelZoom: false,   // the page keeps scrolling when the pointer is over the map
    dragging: !touch,         // on phones one finger scrolls the page, two fingers move the map
    touchZoom: true,
    zoomControl: true,
    attributionControl: true,
    minZoom: 4,
    maxZoom: 12,
  });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  }).addTo(map);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');

  const popupHtml = (city) => `<strong>${city.name}</strong>${city.home ? text('contact.map.home') : text('contact.map.city')}`;
  const markers = CITIES.map((city) => {
    const icon = L.divIcon({ className: '', html: `<span class="map-pin${city.home ? ' home' : ''}"></span>`, iconSize: city.home ? [42, 42] : [34, 34], iconAnchor: city.home ? [21, 42] : [17, 34], popupAnchor: [0, city.home ? -40 : -32] });
    const marker = L.marker([city.lat, city.lng], { icon, title: city.name, alt: city.name, keyboard: true }).addTo(map);
    marker.bindPopup(popupHtml(city), { maxWidth: 240 });
    return { city, marker };
  });
  map.fitBounds(L.latLngBounds(CITIES.map((c) => [c.lat, c.lng])), { padding: [36, 36] });

  // Two fingers pan the map on phones.
  if (touch) {
    element.addEventListener('touchstart', (event) => { if (event.touches.length > 1) map.dragging.enable(); }, { passive: true });
    element.addEventListener('touchend', (event) => { if (event.touches.length === 0) map.dragging.disable(); }, { passive: true });
  }

  return {
    refreshText() { markers.forEach(({ city, marker }) => marker.setPopupContent(popupHtml(city))); },
    openCity(name) { const found = markers.find((m) => m.city.name === name); if (found) found.marker.openPopup(); },
    cities: CITIES.map((c) => c.name),
    map,
  };
}

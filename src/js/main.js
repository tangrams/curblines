import 'babel-polyfill'
import 'whatwg-fetch' // Polyfills window.fetch

import L from 'leaflet'
import Tangram from 'tangram' // via browserify-shim
import 'leaflet-hash'

const locations = {
  'Oakland': [37.8044, -122.2708, 15],
  'New York': [40.70531887544228, -74.00976419448853, 15],
  'Seattle': [47.5937, -122.3215, 15],
  'Philadelphia': [39.95200, -75.16400, 18]
}

// Parse URL hash, expecting leaflet-hash format
// #[zoom],[lat],[lng]
const urlHash = window.location.hash.slice(1, window.location.hash.length).split('/')

// Map start location is Philadelphia, unless the hash changes it
let mapStartLocation = locations['Philadelphia']

if (urlHash.length === 3) {
  // Converts values from strings
  mapStartLocation = [urlHash[1], urlHash[2], urlHash[0]].map(Number)
}

// Instatiate Leaflet map and Tangram
const map = L.map('map', {
  'keyboardZoomOffset': .05
}).setView(mapStartLocation.slice(0, 3), mapStartLocation[2])

const layer = Tangram.leafletLayer({
  scene: 'scene/bubble-wrap.yaml',
  attribution: '&copy; OpenStreetMap contributors | <a href="https://mapzen.com/">Mapzen</a>'
}).addTo(map);

let scene = layer.scene;
let hash = new L.Hash(map)

// Hashes update parent if iframed
window.addEventListener('hashchange', function () {
  parent.postMessage(window.location.hash, '*')
})

// Debug
window.layer = layer
window.scene = scene
window.map = map

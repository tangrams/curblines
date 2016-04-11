import 'babel-polyfill'
import 'whatwg-fetch' // Polyfills window.fetch

import L from 'leaflet'
import Tangram from 'tangram' // via browserify-shim
import 'leaflet-hash'

const VECTOR_TILES_API_KEY = 'vector-tiles-TZJgMv2'

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

// Add the curblines stuff dynamically.
layer.scene.subscribe({
  load: function (msg) {
    const scene = msg.config
    const CURBS_ORDER = 290
    const GRASS_ORDER = 291
    const PHILADELPHIA_DATA = [{
      name: 'roadbed',
      url: 'data/philadelphia/roadbed.geojson',
      draw: {
        lines: {
          color: '#ccc',
          order: 391,
          width: '2px',
        },
        polygons: {
          color: '#fff',
          order: 390,
          // extrude: 2
        }
      }
    }, {
    //   name: 'block',
    //   url: 'data/philadelphia/block.geojson',
    //   draw: {
    //     lines: {
    //       color: '#ccc',
    //       order: CURBS_ORDER,
    //       width: '2px',
    //     },
    //     polygons: {
    //       color: '#ddd',
    //       order: 16,
    //       extrude: 2
    //     }
    //   }
    // }, {
      name: 'concrete',
      url: 'data/philadelphia/concrete.geojson',
      draw: {
        lines: {
          color: '#ccc',
          order: CURBS_ORDER,
          width: '2px',
        },
        polygons: {
          color: '#ddd',
          order: 16,
          extrude: 2
        }
      }
    }, {
      name: 'grass',
      url: 'data/philadelphia/grass.geojson',
      draw: {
        dots2: {
          // color: '[0.600,0.790,0.714]',
          color: '#ccc',
          order: GRASS_ORDER,
        },
        lines: {
          color: '#b3b3b3',
          order: GRASS_ORDER,
          width: '2px',
        },
        // polygons: {
        //   color: '#00ea41',
        //   order: 16,
        //   extrude: 2
        // }
      }
    }, {
      name: 'shoulder',
      url: 'data/philadelphia/shoulder.geojson',
      draw: {
        lines: {
          color: '#ccc',
          order: CURBS_ORDER,
          width: '2px',
        },
        polygons: {
          color: '#ddd',
          order: 16,
          extrude: 2
        }
      }
    }]

    // Use demo-specific vector tiles API key
    scene.sources.osm.url = 'https://vector.mapzen.com/osm/all/{z}/{x}/{y}.mvt?api_key=' + VECTOR_TILES_API_KEY

    for (let geo of PHILADELPHIA_DATA) {
      // Tangram requires a source URL to be fully qualified, so rebuild the
      // relative reference to the URL using the current location path
      const url = window.location.origin + window.location.pathname + geo.url

      const layerStyle = {
        data: { source: geo.name },
        filter: { $zoom: { min: 16 }},
        draw: geo.draw
      }

      // Modify the config directly, just before it renders
      scene.sources[geo.name] = {
        type: 'GeoJSON',
        url: url
      }
      scene.layers[geo.name] = layerStyle
    }

    // Make earth white (simulating road space)
    // scene.layers['earth'].draw.polygons.color = function () {
    //   if ($zoom >= 16) return 'white'
    //   else return '#ddd'
    // }

    // Hide roads past zoom 16
    // But this hides everything, including paths
    // scene.layers['roads'].filter.$zoom = { max: 16 }

    // Only hide certain types of roads past zoom 16.
    scene.layers['roads'].highway.filter.$zoom = { max: 16 }
    scene.layers['roads'].major_road.filter.$zoom = { max: 16 }
    scene.layers['roads'].minor_road.filter.$zoom = { max: 16 }
    scene.layers['roads'].service_road.filter.$zoom = { max: 16 }
    scene.layers['roads'].track.filter.$zoom = { max: 16 }
  }
})

let scene = layer.scene
let hash = new L.Hash(map)

// Hashes update parent if iframed
window.addEventListener('hashchange', function () {
  parent.postMessage(window.location.hash, '*')
})

// Debug
window.layer = layer
window.scene = scene
window.map = map

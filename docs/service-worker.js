const CACHE_NAME = 'dependencies-cache'

// Files required to make this app work offline
const REQUIRED_FILES = [
  'icon.png',
  'index.html',
  '/', // Separate URL than index.html!
  'bundle.js'
]

self.addEventListener('install', (event) => event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(REQUIRED_FILES))
      .then(() => self.skipWaiting())
  )
)

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
      }
    )
  )
})

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

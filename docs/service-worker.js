const CACHE_NAME = 'dependencies-cache'

const offlineFiles = [
  'icon.png',
  'index.html',
  'bundle.js'
]

const githubPagesFiles = offlineFiles.map((f) => `accounts-web/${f}`)

self.addEventListener('install', (event) => event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(['/', ...offlineFiles, ...githubPagesFiles]))
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

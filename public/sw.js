/* Tank Tracker — minimal service worker for installability.
   Network-first: does not cache app shells so auth/session stay fresh. */

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request))
})

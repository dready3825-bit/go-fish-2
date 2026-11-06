/* Go Fish 2 service worker — offline solo play.
   Pre-caches only the app page itself; the PWA icons live in the page as
   data URIs, so there are no icon files to cache. Anything else the page
   loads is cached at runtime on first fetch. Live room WebSocket traffic
   is never cached. Note: for the worker to control the page it must sit
   next to index.html when deployed at a site root; the page registers it
   defensively and plays fine without it. */
var CACHE = "gofish2-v8";
var SHELL = ["../index.html"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    return fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy).catch(function () {}); });
      return res;
    }).catch(function () {
      return caches.match("../index.html");
    });
  }));
});

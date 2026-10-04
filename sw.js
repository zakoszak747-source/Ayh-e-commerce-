/* AYH Boutique - service worker.
   Pour publier une mise à jour de l'appli, change VERSION ci-dessous.
   Convention : les miniatures se terminent par -m (ex. img/usb-32-01-m.webp). */
var VERSION = 'v2';
var SHELL = 'ayh-shell-' + VERSION;
var MINI = 'ayh-mini';
var PHOTOS = 'ayh-photos';
var MAX_PHOTOS = 30;
var COEUR = ['./', 'index.html', 'manifest.json', 'produits.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];
var EST_MINI = /-m\.(webp|jpe?g|png)$/i;
var EST_IMAGE = /\.(webp|jpe?g|png|gif|svg)$/i;

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL)
      .then(function (c) { return c.addAll(COEUR); })
      .then(precacherMiniatures)
  );
  self.skipWaiting();
});

function precacherMiniatures() {
  return fetch('produits.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var urls = (d.produits || [])
        .map(function (p) { return p.photos && p.photos.miniature; })
        .filter(Boolean);
      return caches.open(MINI).then(function (c) {
        return Promise.all(urls.map(function (u) { return c.add(u).catch(function () {}); }));
      });
    })
    .catch(function () {});
}

self.addEventListener('activate', function (e) {
  var garder = [SHELL, MINI, PHOTOS];
  e.waitUntil(
    caches.keys()
      .then(function (noms) {
        return Promise.all(noms
          .filter(function (n) { return n.indexOf('ayh-') === 0 && garder.indexOf(n) < 0; })
          .map(function (n) { return caches.delete(n); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (EST_IMAGE.test(url.pathname)) { e.respondWith(image(req, url)); return; }
  if (/\/produits\.json$/.test(url.pathname)) { e.respondWith(donnees(req)); return; }
  e.respondWith(coque(req));
});

/* Images : le cache d'abord. Miniatures gardées toujours, grandes photos limitées. */
function image(req, url) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (rep) {
      if (rep && rep.ok) {
        var copie = rep.clone();
        var mini = EST_MINI.test(url.pathname);
        caches.open(mini ? MINI : PHOTOS).then(function (c) {
          return c.put(req, copie).then(function () { if (!mini) return limiter(c); });
        });
      }
      return rep;
    });
  });
}

function limiter(c) {
  return c.keys().then(function (ks) {
    var trop = ks.length - MAX_PHOTOS;
    if (trop <= 0) return;
    return Promise.all(ks.slice(0, trop).map(function (k) { return c.delete(k); }));
  });
}

/* Catalogue : affiché tout de suite depuis le cache, mis à jour en arrière-plan. */
function donnees(req) {
  var maj = fetch(req.url, { cache: 'no-cache' }).then(function (rep) {
    if (rep && rep.ok) {
      var copie = rep.clone();
      caches.open(SHELL).then(function (c) { c.put('produits.json', copie); });
    }
    return rep;
  });
  if (req.cache === 'reload') {
    return maj.catch(function () { return caches.match('produits.json'); });
  }
  return caches.match('produits.json').then(function (hit) {
    if (hit) { maj.catch(function () {}); return hit; }
    return maj;
  });
}

/* Page et fichiers de l'appli : cache d'abord, mise à jour en arrière-plan. */
function coque(req) {
  return caches.match(req, { ignoreSearch: true }).then(function (hit) {
    var reseau = fetch(req).then(function (rep) {
      if (rep && rep.ok) {
        var copie = rep.clone();
        caches.open(SHELL).then(function (c) { c.put(req, copie); });
      }
      return rep;
    });
    if (hit) { reseau.catch(function () {}); return hit; }
    return reseau.catch(function () { return caches.match('index.html'); });
  });
}

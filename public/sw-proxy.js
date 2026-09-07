/**
 * Service Worker Proxy Interceptor (sw-proxy.js)
 * Production Service Worker Engine featuring Dynamic Route Matching, Response Header Sanitization
 * (CSP / X-Frame-Options removal), Multi-tier Caching, Failover Endpoint Load Balancing,
 * and Request Payload Transformations.
 */

const CACHE_NAME = 'wsm-stealth-cache-v3';
const CACHE_ASSETS = ['/offline.html'];

// Failover proxy endpoint cluster
const PROXY_BACKENDS = [
  '/api/proxy',
  '/api/v2/cdn-fetch',
  '/proxy-sub/fallback',
];

let currentBackendIndex = 0;

function getActiveProxyBackend() {
  return PROXY_BACKENDS[currentBackendIndex % PROXY_BACKENDS.length];
}

function rotateProxyBackend() {
  currentBackendIndex = (currentBackendIndex + 1) % PROXY_BACKENDS.length;
}

// Lifecycle: Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_ASSETS).catch(() => {
        // Soft fail if offline asset is missing
      });
    })
  );
  self.skipWaiting();
});

// Lifecycle: Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Sanitize & Inject Stealth Headers
function createStealthResponse(response) {
  const newHeaders = new Headers(response.headers);

  // Set permissive CORS headers
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Credentials', 'true');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', '*');

  // Strip restrictive security headers that prevent cross-origin embedding
  newHeaders.delete('X-Frame-Options');
  newHeaders.delete('Content-Security-Policy');
  newHeaders.delete('Content-Security-Policy-Report-Only');
  newHeaders.delete('X-Content-Type-Options');

  // Add custom proxy diagnostics
  newHeaders.set('X-WSM-Proxied-By', 'ServiceWorker-Interceptor-V3');
  newHeaders.set('X-WSM-Timestamp', Date.now().toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// Lifecycle: Fetch Interception
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Filter 1: Proxy route interception (/proxy-sub/ or /api/v2/cdn-fetch or target parameter)
  if (
    url.pathname.startsWith('/proxy-sub/') ||
    url.pathname.startsWith('/api/v2/cdn-fetch') ||
    url.searchParams.has('target') ||
    url.searchParams.has('url')
  ) {
    const rawTarget = url.searchParams.get('url') || url.searchParams.get('target') || url.pathname.replace('/proxy-sub/', '');
    if (!rawTarget) return;

    event.respondWith(
      (async () => {
        const backend = getActiveProxyBackend();
        const proxiedUrl = `${backend}?url=${encodeURIComponent(rawTarget)}`;

        const customRequestHeaders = new Headers(request.headers);
        customRequestHeaders.set('X-WSM-Intercept', 'true');
        customRequestHeaders.set('X-Spoofed-Worker', 'active');
        customRequestHeaders.set('Sec-CH-UA', '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"');
        customRequestHeaders.set('Sec-CH-UA-Platform', '"Windows"');

        try {
          const response = await fetch(proxiedUrl, {
            method: request.method,
            headers: customRequestHeaders,
            body: ['GET', 'HEAD'].includes(request.method) ? null : await request.clone().arrayBuffer(),
          });

          if (!response.ok && response.status >= 500) {
            rotateProxyBackend(); // Failover rotation on server error
          }

          return createStealthResponse(response);
        } catch (err) {
          rotateProxyBackend();
          return new Response(
            JSON.stringify({
              error: 'WSM Proxy Routing Error',
              message: err.message,
              backendAttempted: backend,
              timestamp: Date.now(),
            }),
            {
              status: 502,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      })()
    );
    return;
  }

  // Filter 2: Stale-While-Revalidate caching strategy for static resources
  if (request.method === 'GET' && url.origin === self.location.origin) {
    const isStaticAsset = /\.(js|css|png|jpg|svg|woff2|json)$/i.test(url.pathname);
    if (isStaticAsset) {
      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cachedResponse = await cache.match(request);
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        })
      );
    }
  }
});

// Lifecycle: Inter-Thread Messaging
self.addEventListener('message', (event) => {
  const { action } = event.data || {};

  switch (action) {
    case 'PURGE_CACHE':
      event.waitUntil(
        caches.delete(CACHE_NAME).then((success) => {
          event.ports[0]?.postMessage({ action: 'CACHE_PURGED', success });
        })
      );
      break;

    case 'GET_SW_STATUS':
      event.ports[0]?.postMessage({
        status: 'ACTIVE',
        cacheName: CACHE_NAME,
        activeBackend: getActiveProxyBackend(),
        backendCluster: PROXY_BACKENDS,
      });
      break;

    default:
      break;
  }
});
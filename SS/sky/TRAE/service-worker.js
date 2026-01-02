// 缓存版本号，用于更新缓存
const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `sky-events-${CACHE_VERSION}`;

// 需要缓存的静态资源列表
const STATIC_CACHE_URLS = [
  './index.html',
  './hhs.html',
  './manifest.json',
  './icons/favicon.png',
  './icons/logo.png',
  './icons/logo-192.png',
  './icons/hs.png',
  './icons/gj.svg',
  './libs/font-awesome/css/font-awesome.min.css',
  'https://cdn.tailwindcss.com'
];

// 安装阶段：缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 缓存静态资源');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除旧版本缓存
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: 删除旧缓存', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 网络请求阶段：根据资源类型采用不同缓存策略
self.addEventListener('fetch', (event) => {
  // 不缓存Supabase API请求
  const requestUrl = new URL(event.request.url);
  if (requestUrl.hostname.includes('supabase.co')) {
    // 对于Supabase请求，直接从网络获取，不使用缓存
    return event.respondWith(
      fetch(event.request).catch(() => {
        // 网络请求失败时，返回503状态
        return new Response('Service Unavailable', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
  }
  
  // 对于图片资源，采用stale-while-revalidate策略
  // 即先返回缓存，同时从网络获取更新，确保下次获取到最新版本
  const isImageRequest = event.request.headers.get('accept')?.includes('image') || 
                         requestUrl.pathname.endsWith('.png') || 
                         requestUrl.pathname.endsWith('.jpg') || 
                         requestUrl.pathname.endsWith('.jpeg') || 
                         requestUrl.pathname.endsWith('.gif') || 
                         requestUrl.pathname.endsWith('.webp');
  
  if (isImageRequest) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // 无论缓存是否存在，都从网络获取最新版本
        const networkFetch = fetch(event.request).then((networkResponse) => {
          // 克隆响应，因为响应流只能使用一次
          const responseToCache = networkResponse.clone();
          
          // 更新缓存
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(error => {
              console.error('Service Worker: 更新图片缓存失败:', error);
            });
          });
          
          return networkResponse;
        }).catch(() => {
          // 网络请求失败时，如果有缓存则返回缓存
          if (cachedResponse) {
            return cachedResponse;
          }
          // 没有缓存且网络失败时，返回默认图片或错误
          return new Response('Image not available', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
        
        // 如果有缓存，先返回缓存，同时后台更新缓存
        return cachedResponse || networkFetch;
      })
    );
  } else {
    // 对于非图片资源，继续使用缓存优先策略
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // 如果缓存中存在资源，返回缓存资源
        if (cachedResponse) {
          return cachedResponse;
        }

        // 否则从网络获取资源
        return fetch(event.request)
          .then((networkResponse) => {
            // 如果响应有效，将其缓存
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // 如果网络请求失败，返回默认页面
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
    );
  }
});

// 处理推送通知
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: './icons/logo-192.png',
    badge: './icons/favicon.png',
    data: {
      url: data.url || './index.html'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
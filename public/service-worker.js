const CACHE="ants-pixel-hunt-shell-v2";
const STATIC_FILES=["./","./manifest.webmanifest","./assets/icon-192.svg","./assets/icon-512.svg"];
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const response=await fetch("./");
  const html=await response.clone().text();
  await cache.put("./",response);
  const bundles=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match=>match[1]);
  await cache.addAll(STATIC_FILES.slice(1));
  if(bundles.length)await cache.addAll(bundles);
  await self.skipWaiting();
 })());
});
self.addEventListener("activate",event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
  return response;
 }).catch(()=>caches.match("./"))));
});

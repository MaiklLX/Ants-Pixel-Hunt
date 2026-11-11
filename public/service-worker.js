const CACHE="ants-pixel-hunt-shell-v49-kt079";
const STATIC_FILES=["./manifest.webmanifest","./assets/icon-192.svg","./assets/icon-512.svg"];
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const response=await fetch("./",{cache:"reload"});
  if(!response.ok)throw new Error("Could not fetch latest app shell");
  const html=await response.clone().text();
  await cache.put("./",response);
  await cache.addAll(STATIC_FILES);
  const bundles=[...html.matchAll(new RegExp('(?:src|href)="([^"]+\\.(?:js|css))"',"g"))].map(match=>match[1]);
  if(bundles.length)await cache.addAll(bundles);
  await self.skipWaiting();
 })());
});
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting();});
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith("ants-pixel-hunt-shell-")&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==="navigate"){
  event.respondWith((async()=>{
   try{
    const fresh=await fetch(request,{cache:"no-store"});
    if(fresh.ok){const cache=await caches.open(CACHE);await cache.put("./",fresh.clone());await cache.put(request,fresh.clone());}
    return fresh;
   }catch(error){return await caches.match(request)||await caches.match("./")||Response.error();}
  })());
  return;
 }
 event.respondWith((async()=>{
  const cached=await caches.match(request);
  if(cached)return cached;
  try{
   const response=await fetch(request);
   if(response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone());}
   return response;
  }catch(error){return Response.error();}
 })());
});

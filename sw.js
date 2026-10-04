/* Стройтрест: работа без интернета.
   Страница игры берётся из сети, когда она есть (так обновления приходят сами), иначе из сохранённой копии.
   Остальное (иконки, шрифты) отдаётся из копии и докачивается при первом обращении. */
const CACHE='stroytrest-v1';
const SHELL=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  const page=r.mode==='navigate'||(u.origin===location.origin&&/(\/|index\.html)$/.test(u.pathname));
  if(page){
    e.respondWith(
      fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})
        .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(r).then(m=>m||fetch(r).then(res=>{
      if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}
      return res;
    }))
  );
});

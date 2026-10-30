/* ==========================================================================
   Almacén del video de la Landing (IndexedDB, compartido admin ↔ landing)
   ==========================================================================

   El admin sube un MP4 sin audio, una pista de audio por idioma y los
   subtítulos (.vtt); la landing reproduce el video silenciado, sincroniza la
   pista elegida y pinta el subtítulo activo.

   Los archivos pesan demasiado para localStorage (~5 MB), así que se guardan
   como Blob en IndexedDB. IndexedDB no avisa a otras pestañas, por eso cada
   cambio escribe un sello en localStorage `unopago-media-v1`: la landing escucha
   su evento `storage` y recarga el video al vuelo.

   Registros (store `files`):
     'video'  → { blob, name, duration, poster: Blob, previews: Blob }
     'tracks' → { defaultId, list: [{ id, label, name, duration, blob }] }
     'subs'   → { list: [{ id, label, name, vtt }] }   (vtt = texto WebVTT)

   Mientras el admin no suba nada, la landing usa los archivos de demostración
   de media/ (DEFAULTS). */

(function () {
  const DB_NAME = 'unopago-media';
  const DB_VERSION = 1;
  const STORE = 'files';
  const NOTIFY_KEY = 'unopago-media-v1';

  /* Archivos de demostración (extraídos de media/cobrar-cliente*.mp4). */
  const DEFAULTS = {
    video: {
      src: 'media/cobrar-cliente-sin-audio.mp4',
      poster: 'media/cobrar-cliente-poster.jpg',
      previews: 'media/cobrar-cliente-previews.jpg'
    },
    tracks: {
      defaultId: 'es',
      list: [
        { id: 'en', label: 'Inglés', src: 'media/cobrar-cliente-audio-en.m4a' },
        { id: 'es', label: 'Español', src: 'media/cobrar-cliente-audio-es.m4a' }
      ]
    },
    /* El texto sale de media/cobrar-cliente.subs.js (window.VP_SUBTITLES) y no de
       los .vtt de media/, porque con file:// el navegador bloquea leer archivos.
       Los .vtt son la misma transcripción, listos para subir desde el admin. */
    subs: [
      { id: 'es', label: 'Español' },
      { id: 'en', label: 'Inglés' }
    ]
  };

  /* Convierte un texto WebVTT en cues [inicio, fin, texto]. */
  const parseVtt = vtt => {
    const sec = t => t.split(':').reduce((acc, n) => acc * 60 + parseFloat(n), 0);
    return String(vtt || '').replace(/\r/g, '').split(/\n{2,}/).map(block => {
      const lines = block.split('\n');
      const at = lines.findIndex(l => l.includes('-->'));
      if (at < 0) return null;
      const [a, b] = lines[at].split('-->').map(s => s.trim().split(/\s+/)[0]);
      return [sec(a), sec(b), lines.slice(at + 1).join('\n').trim()];
    }).filter(c => c && c[2] && isFinite(c[0]) && isFinite(c[1]) && c[1] > c[0]);
  };

  let dbPromise = null;
  const open = () => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('IndexedDB no disponible')); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => { dbPromise = null; });
    return dbPromise;
  };

  const run = (mode, fn) => open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req && req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transacción abortada'));
  }));

  const notify = () => {
    try { localStorage.setItem(NOTIFY_KEY, String(Date.now())); } catch (e) { /* sin aviso entre pestañas */ }
  };

  const get = key => run('readonly', s => s.get(key)).then(v => v || null);
  const put = (key, value) => run('readwrite', s => s.put(value, key)).then(notify);
  const del = key => run('readwrite', s => s.delete(key)).then(notify);

  window.UnoMedia = {
    NOTIFY_KEY,
    DEFAULTS,
    parseVtt,
    getVideo: () => get('video'),
    putVideo: rec => put('video', rec),
    deleteVideo: () => del('video'),
    /* Siempre devuelve { defaultId, list }; lista vacía si no hay pistas cargadas. */
    getTracks: () => get('tracks').then(t => (t && Array.isArray(t.list) ? t : { defaultId: null, list: [] })),
    putTracks: rec => put('tracks', rec),
    /* Siempre devuelve { list }; lista vacía si no hay subtítulos cargados. */
    getSubs: () => get('subs').then(t => (t && Array.isArray(t.list) ? t : { list: [] })),
    putSubs: rec => put('subs', rec)
  };
})();

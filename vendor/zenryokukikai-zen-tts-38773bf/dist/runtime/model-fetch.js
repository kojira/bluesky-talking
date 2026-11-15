// Cache only the immutable, version-pinned assets used by this application.
// Changing either upstream revision also changes the request URL (cache key).
const CACHE = 'bluesky-talking-zen-tts-v1';
const ASSETS = new Set([
    'https://huggingface.co/kojira/zen-tts-models/resolve/4c61092805c3cc37343e35c67c28c04c93129425/bluesky.ztm',
    'https://cdn.jsdelivr.net/gh/zenryokukikai/zen-tts@v1.3.0/models/g2p/g2p.json',
    'https://cdn.jsdelivr.net/gh/zenryokukikai/zen-tts@v1.3.0/models/g2p/g2p.bin',
    'https://cdn.jsdelivr.net/gh/zenryokukikai/zen-tts@v1.3.0/cpu/tts-cpu.wasm',
]);
export async function clearModelCache() {
    try { if (globalThis.caches) await caches.delete(CACHE); } catch { /* storage is optional */ }
}
export async function modelFetch(url) {
    const key = new URL(url, location.href).href;
    if (!ASSETS.has(key) || !globalThis.caches) return fetch(url);
    let cache;
    try {
        cache = await caches.open(CACHE);
        const hit = await cache.match(key);
        if (hit && hit.ok) return hit;
    } catch { /* private browsing, disabled storage, etc. */ }
    const response = await fetch(url);
    if (response.ok && cache) {
        try { await cache.put(key, response.clone()); } catch { /* quota or storage unavailable */ }
    }
    return response;
}

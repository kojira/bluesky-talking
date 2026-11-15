// The few Node.js built-ins the Node entry uses, loaded at run time (the package builds without @types/node).
// Node >= 20.
let apis = null;
/** node:fs, node:path, node:module, node:url and process (throws outside Node). */
export function nodeApis() {
    apis ??= (async () => {
        const proc = globalThis.process;
        if (!proc?.versions?.node)
            throw new Error('zen-tts/node runs on Node.js (use the "zen-tts" entry in the browser)');
        const imp = (id) => import(/* @vite-ignore */ id);
        const [fs, path, module, url] = await Promise.all([imp('node:fs'), imp('node:path'), imp('node:module'), imp('node:url')]);
        return { fs, path, module, url, process: proc };
    })();
    return apis;
}

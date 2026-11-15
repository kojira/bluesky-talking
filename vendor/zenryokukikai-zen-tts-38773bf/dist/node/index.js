// zen-tts/node: ZEN-TTS on Node.js (>= 26.12.1), CPU only.
//
//   import { ZenTtsNode } from 'zen-tts/node';
//   const tts = await ZenTtsNode.load({ modelsPath: './models' });
//   const r = await tts.speak('こんにちは。', { emotion: { happy: 70, neutral: 30 } });   // r.pcm: Float32Array, 44.1 kHz
//   for await (const c of tts.speakStream(longText)) { ... c.pcm ... }                 // one sentence at a time
//
// The same steps and weights as the browser's CPU path (src/runtime/cpu-tts.ts: text frontend, G2P, prosody, emotion
// blend / curve, dictionary). The kernels run in the native build of native/tts-cpu.c when it is there (linux-x64:
// AVX-512 > AVX2 > SSE4.1, picked at load), else in cpu/tts-cpu.wasm. The kernels give the same audio on every build
// (same sums in the same order, no FMA), so the output equals the browser's CPU output.
import { CpuOwnTts } from '../runtime/cpu-tts.js';
import { nsfExportToWeights, nsfF0Norm, nsfOutputGain } from '../runtime/nsf-weights.js';
import { withBuiltinDict } from '../runtime/builtin-dict.js';
import { numbersToAmounts } from '../runtime/ja-text-normalize.js';
import { curveFn, curvePoints, engineOptionsOf, splitSentences } from '../runtime/speak-options.js';
import { nodeApis } from './node-api.js';
import { g2pMismatch, ownFromZtm, parseZtm, vocoderFromZtm } from '../runtime/ztm.js';
export { emotionNames, neutralBlend } from '../runtime/emotion.js';
export { emotionBlend, splitSentences } from '../runtime/speak-options.js';
export { SPEED_MIN, SPEED_MAX, PITCH_MIN, PITCH_MAX } from '../runtime/speak-rate.js';
export { NUMBER_READINGS } from '../runtime/ja-text-normalize.js';
import { streamMaxChars } from '../runtime/speak-rate.js';
export { TTS_DEMO_CURVES as EMOTION_CURVES } from '../runtime/emotion-curve.js';
export { DEFAULT_OWN_DICT_SETTINGS as DEFAULT_DICT_SETTINGS } from '../runtime/tts-own-prosody.js';
export const SAMPLE_RATE = 44100;
export { VERSION, VOICE, VOICES, ZTM_BASE_URL, voiceDirs, ztmUrl } from '../version.js';
export { parseZtm } from '../runtime/ztm.js';
import { voiceDirs } from '../version.js';
const BUILDS = ['avx512', 'avx2', 'sse41'];
/** CPU features a native build needs (from /proc/cpuinfo on Linux; empty elsewhere). */
function cpuFlags(n) {
    if (n.process.platform !== 'linux')
        return new Set();
    try {
        const t = new TextDecoder().decode(n.fs.readFileSync('/proc/cpuinfo'));
        const line = t.split('\n').find((l) => l.startsWith('flags'));
        return new Set((line?.split(':')[1] ?? '').trim().split(/\s+/));
    }
    catch {
        return new Set();
    }
}
const NEEDS = { avx512: ['avx512f'], avx2: ['avx2'], sse41: ['sse4_1'] };
/** The package root (two levels above dist/node/). */
function packageRoot(n) {
    return n.path.resolve(n.path.dirname(n.url.fileURLToPath(import.meta.url)), '..', '..');
}
function loadNative(n, o) {
    if (n.process.platform !== 'linux' || n.process.arch !== 'x64')
        return { error: `no native build for ${n.process.platform}-${n.process.arch}` };
    const dir = o.nativeDir ?? n.process.env['ZEN_TTS_NATIVE_DIR'] ?? n.path.join(packageRoot(n), 'native', 'x86', 'build');
    const forced = (o.kernel ?? n.process.env['ZEN_TTS_KERNEL']);
    if (forced && !BUILDS.includes(forced))
        return { error: `kernel must be ${BUILDS.join(', ')}` };
    const flags = cpuFlags(n);
    const req = n.module.createRequire(import.meta.url);
    const tried = [];
    for (const k of forced ? [forced] : BUILDS) {
        if (!NEEDS[k].every((f) => flags.has(f))) {
            tried.push(`${k}: CPU lacks ${NEEDS[k].join('+')}`);
            continue;
        }
        const p = n.path.join(dir, `zen_tts_${k}.node`);
        if (!n.fs.existsSync(p)) {
            tried.push(`${k}: ${p} not built`);
            continue;
        }
        try {
            return { addon: req(p), kernel: k };
        }
        catch (e) {
            tried.push(`${k}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    return { error: `no native build usable (${tried.join('; ')}); build with \`pnpm run build:native\`` };
}
/** A .ztm from an http(s) URL (the CDN of the release, or your own server). */
async function download(url) {
    const r = await fetch(url);
    if (!r.ok)
        throw new Error(`zen-tts/node: ${url}: ${r.status}`);
    return r.arrayBuffer();
}
const buf = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
export class ZenTtsNode {
    tts;
    kernel;
    voice;
    header;
    /** How long amounts and numbers before a unit are read when a call does not say (NodeLoadOptions.numbers). */
    numbers = 'rule';
    constructor(tts, kernel, voice, header) {
        this.tts = tts;
        this.kernel = kernel;
        this.voice = voice;
        this.header = header;
    }
    static async load(o = {}) {
        numbersToAmounts(o.numbers);
        const n = await nodeApis();
        const models = n.path.resolve(o.modelsPath ?? 'models');
        const read = (p, what) => {
            if (!n.fs.existsSync(p))
                throw new Error(`zen-tts/node: ${p} is missing (${what})`);
            return n.fs.readFileSync(p);
        };
        let meta, bin, nsfMeta, nsfBin, voice, header;
        if (o.model !== undefined) {
            const z = parseZtm(/^https?:\/\//.test(o.model) ? await download(o.model) : buf(read(n.path.resolve(o.model), 'model: a .ztm file')));
            // the G2P: <modelsPath>/g2p, or the package's own models/g2p when modelsPath is not given
            const g2pDir = o.modelsPath !== undefined ? n.path.join(models, 'g2p') : n.path.join(packageRoot(n), 'models', 'g2p');
            const g2pWhat = 'the G2P: g2p/g2p.json and g2p/g2p.bin (the package\'s models/g2p, or under modelsPath)';
            const g2p = JSON.parse(new TextDecoder().decode(read(n.path.join(g2pDir, 'g2p.json'), g2pWhat)));
            const warn = g2pMismatch(z, g2p);
            if (warn)
                console.warn(warn);
            ({ meta, bin } = ownFromZtm(z, g2p, buf(read(n.path.join(g2pDir, 'g2p.bin'), g2pWhat))));
            ({ meta: nsfMeta, bin: nsfBin } = vocoderFromZtm(z));
            voice = z.header.voice.id;
            header = z.header;
        }
        else {
            const dirs = voiceDirs(o.voice);
            const what = `modelsPath: the directory with ${dirs.tts}/ and ${dirs.decoder}/`;
            meta = JSON.parse(new TextDecoder().decode(read(n.path.join(models, dirs.tts, 'own.json'), what)));
            nsfMeta = JSON.parse(new TextDecoder().decode(read(n.path.join(models, dirs.decoder, 'nsf.json'), what)));
            bin = buf(read(n.path.join(models, dirs.tts, 'own.bin'), what));
            nsfBin = buf(read(n.path.join(models, dirs.decoder, 'nsf.bin'), what));
            voice = o.voice ?? 'marine';
        }
        const wasm = n.fs.readFileSync(n.path.join(packageRoot(n), 'cpu', 'tts-cpu.wasm'));
        const tts = await CpuOwnTts.create(wasm, meta, bin, nsfExportToWeights(nsfMeta, nsfBin), nsfF0Norm(nsfMeta), nsfOutputGain(nsfMeta));
        const want = o.backend ?? 'auto';
        let kernel = 'wasm';
        if (want !== 'wasm') {
            const r = loadNative(n, o);
            if ('addon' in r) {
                tts.k.useNative(r.addon);
                kernel = r.kernel;
            }
            else if (want === 'native')
                throw new Error(`zen-tts/node: ${r.error}`);
        }
        const t = new ZenTtsNode(tts, kernel, voice, header);
        if (o.numbers !== undefined)
            t.numbers = o.numbers;
        return t;
    }
    /** One sentence (up to about 11 s of speech) to 44.1 kHz mono audio. Synchronous work on this thread. */
    async speak(text, o = {}) {
        return this.speakWith(text, engineOptionsOf({ numbers: this.numbers, ...o }));
    }
    /** speak() with the engine's options as they are (blend / blendAt, labels, f0Add, durScale). */
    async speakWith(text, o) {
        if (o.stream)
            throw new Error('stream is not supported here (use speakStream)');
        const { blendAt, stream: _s, ...rest } = o;
        // a blendAt curve is sampled at the same points as on the browser's CPU path, so the audio matches it
        const opts = blendAt ? { ...rest, blendAt: curveFn(curvePoints(blendAt)) } : rest;
        const r = this.tts.speak(text, { numbers: this.numbers, ...opts, dict: withBuiltinDict(o.dict) });
        return { ...r, pcm: r.audio, sampleRate: SAMPLE_RATE };
    }
    /**
     * A text of any length, one sentence at a time (splitSentences): yields each sentence's audio when it is made, so it
     * can be played, streamed or lip-synced while the next one is synthesised.
     */
    async *speakStream(text, o = {}) {
        const opts = engineOptionsOf({ numbers: this.numbers, ...o });
        let index = 0;
        for (const sentence of splitSentences(text, streamMaxChars(o.speed))) {
            const r = await this.speakWith(sentence, opts);
            yield { index: index++, text: sentence, pcm: r.pcm, sampleRate: SAMPLE_RATE, timing: r.timing };
            // let other work run between sentences (synthesis itself is synchronous)
            await new Promise((res) => setTimeout(res, 0));
        }
    }
    /** Readings and accent marks the model would use (after the dictionary). */
    analyze(text, dict = [], o = {}) {
        const numbers = o.numbers ?? this.numbers;
        numbersToAmounts(numbers);
        return this.tts.analyze(text, withBuiltinDict(dict), true, numbers);
    }
    /** Bytes of the kernels' memory (weights + work). */
    get memoryBytes() { return this.tts.k.bytes; }
    destroy() { }
}
/** Mono float audio -> 16-bit PCM WAV bytes. */
export function wavBytes(pcm, sampleRate = SAMPLE_RATE) {
    const n = pcm.length;
    const out = new Uint8Array(44 + n * 2);
    const v = new DataView(out.buffer);
    const s = (o, t) => { for (let i = 0; i < t.length; i++)
        v.setUint8(o + i, t.charCodeAt(i)); };
    s(0, 'RIFF');
    v.setUint32(4, 36 + n * 2, true);
    s(8, 'WAVE');
    s(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, sampleRate, true);
    v.setUint32(28, sampleRate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    s(36, 'data');
    v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++)
        v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);
    return out;
}

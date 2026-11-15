import { WgslOwnTts, type OwnSpeakOptions, type OwnSpeakResult } from './runtime/tts-own-device.js';
import { emotionNames, neutralBlend, type EmotionBlend, type EmotionName } from './runtime/emotion.js';
import { type SpeakOptions } from './runtime/speak-options.js';
import type { OwnDictEntry, OwnDictSettings, OwnMeta } from './runtime/tts-own-prosody.js';
import { type NumberReading } from './runtime/ja-text-normalize.js';
import { type ZtmHeader } from './runtime/ztm.js';
export { emotionNames, neutralBlend, type EmotionBlend, type EmotionName };
export { TTS_DEMO_CURVES as EMOTION_CURVES, TTS_DEMO_CURVE_LABEL as EMOTION_CURVE_LABEL, type TtsDemoCurve as EmotionCurve } from './runtime/emotion-curve.js';
export type { OwnDictEntry as DictEntry, OwnDictSettings as DictSettings, OwnSpeakResult as SpeakResult, OwnSpeakOptions as EngineSpeakOptions };
export { DEFAULT_OWN_DICT_SETTINGS as DEFAULT_DICT_SETTINGS, pitchRangeOf } from './runtime/tts-own-prosody.js';
/** The weight set names under modelsUrl (of the default voice 'marine'; see voiceDirs). */
export declare const MODEL_SET = "tts";
export declare const DECODER_SET = "decoder";
export declare const SAMPLE_RATE = 44100;
export { VERSION, VOICE, VOICES, ZTM_BASE_URL, voiceDirs, ztmUrl, type VoiceId } from './version.js';
export { parseZtm, type ZtmHeader } from './runtime/ztm.js';
import { type VoiceId } from './version.js';
export { emotionBlend, splitSentences, type EmotionAmounts, type SpeakOptions } from './runtime/speak-options.js';
export { SPEED_MIN, SPEED_MAX, PITCH_MIN, PITCH_MAX } from './runtime/speak-rate.js';
export { NUMBER_READINGS, type NumberReading } from './runtime/ja-text-normalize.js';
/** Where the voice is made: 'webgpu', 'cpu' (WebAssembly SIMD), or 'auto' (WebGPU if available, else CPU). */
export type Backend = 'auto' | 'webgpu' | 'cpu';
export interface LoadOptions {
    /** URL of the directory that holds g2p/ (with model), or tts/ and decoder/ (with voice, the 1.0.0 layout). Default './models'. */
    modelsUrl?: string;
    /** The voice (default 'marine'): 'marine' loads tts/ and decoder/, another id voices/<id>/tts/ and voices/<id>/decoder/
     *  under modelsUrl (voiceDirs). The text frontend and G2P are the same for every voice. */
    voice?: VoiceId;
    /** URL of a voice packed in one file (.ztm, docs/ztm-format.md), e.g. ztmUrl('kikka') on the release's CDN. The G2P is
     *  read from <modelsUrl>/g2p/. Overrides voice. */
    model?: string;
    /** default 'auto' */
    backend?: Backend;
    /** URL of tts-cpu.wasm for the CPU backend (default './cpu/tts-cpu.wasm'). */
    cpuWasmUrl?: string;
    /** An existing GPUDevice to share (WebGPU backend); otherwise one is requested. */
    device?: unknown;
    /** Default of the speak option `numbers`: 'rule' (default) or 'model'. A speak() / analyze() option overrides it. */
    numbers?: NumberReading;
}
/** The engine under ZenTts: WgslOwnTts (WebGPU) or CpuTts (CPU worker); the same options and results. */
interface Engine {
    readonly meta: OwnMeta;
    speak(text: string, o: OwnSpeakOptions): Promise<OwnSpeakResult>;
    analyze(text: string, dict?: readonly OwnDictEntry[], latin?: boolean, numbers?: NumberReading): Promise<Awaited<ReturnType<WgslOwnTts['analyze']>>>;
    destroy(): void;
}
export declare class ZenTts {
    readonly engine: Engine;
    readonly backend: 'webgpu' | 'cpu';
    readonly voice: string;
    readonly header?: ZtmHeader | undefined;
    /** How long amounts and numbers before a unit are read when a call does not say (LoadOptions.numbers). */
    numbers: NumberReading;
    private constructor();
    static load(o?: LoadOptions): Promise<ZenTts>;
    private static loadEngine;
    /** A .ztm voice: one fetch of the file, plus the runtime's G2P under modelsUrl. */
    private static loadZtm;
    /** The model's tables (kana, punctuation, ...) for showing the readings. */
    get meta(): OwnMeta;
    /** One sentence (up to about 11 s of speech) to 44.1 kHz mono audio. */
    speak(text: string, o?: SpeakOptions): Promise<OwnSpeakResult & {
        sampleRate: number;
    }>;
    /**
     * A text of any length, one sentence at a time (splitSentences): yields each sentence's audio as soon as it is made,
     * for playing (or lip-syncing) while the next is synthesised. Same options as speak().
     */
    speakStream(text: string, o?: SpeakOptions): AsyncGenerator<SpeechChunk>;
    /** speak() with the engine's options as they are: a blend (or blendAt curve), and edits from an intonation UI
     *  (labels: accent marks, f0Add: semitones per phone, durScale: length per phone). */
    speakWith(text: string, o: OwnSpeakOptions): Promise<OwnSpeakResult & {
        sampleRate: number;
    }>;
    /** Readings and accent marks the model would use (after the dictionary), for checking / editing. */
    analyze(text: string, dict?: readonly OwnDictEntry[], o?: {
        numbers?: NumberReading;
    }): ReturnType<Engine['analyze']>;
    destroy(): void;
}
/** One sentence of speakStream(): its text and audio (mono float32, 44.1 kHz). */
export interface SpeechChunk {
    index: number;
    text: string;
    pcm: Float32Array;
    sampleRate: number;
    timing: OwnSpeakResult['timing'];
}
/** Mono float audio -> a 16-bit PCM WAV Blob. */
export declare function wavBlob(audio: Float32Array, sampleRate?: number): Blob;

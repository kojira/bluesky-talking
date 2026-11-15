import { CpuOwnTts } from '../runtime/cpu-tts.js';
import type { OwnSpeakOptions, OwnSpeakResult } from '../runtime/tts-own-device.js';
import { type NumberReading } from '../runtime/ja-text-normalize.js';
import { type SpeakOptions } from '../runtime/speak-options.js';
import { type ZtmHeader } from '../runtime/ztm.js';
export { emotionNames, neutralBlend, type EmotionBlend, type EmotionName } from '../runtime/emotion.js';
export { emotionBlend, splitSentences, type EmotionAmounts, type SpeakOptions } from '../runtime/speak-options.js';
export { SPEED_MIN, SPEED_MAX, PITCH_MIN, PITCH_MAX } from '../runtime/speak-rate.js';
export { NUMBER_READINGS, type NumberReading } from '../runtime/ja-text-normalize.js';
export { TTS_DEMO_CURVES as EMOTION_CURVES, type TtsDemoCurve as EmotionCurve } from '../runtime/emotion-curve.js';
export type { OwnDictEntry as DictEntry, OwnDictSettings as DictSettings } from '../runtime/tts-own-prosody.js';
export { DEFAULT_OWN_DICT_SETTINGS as DEFAULT_DICT_SETTINGS } from '../runtime/tts-own-prosody.js';
export declare const SAMPLE_RATE = 44100;
export { VERSION, VOICE, VOICES, ZTM_BASE_URL, voiceDirs, ztmUrl, type VoiceId } from '../version.js';
export { parseZtm, type ZtmHeader } from '../runtime/ztm.js';
import { type VoiceId } from '../version.js';
/** The kernel build in use: a native x86-64 build, or the WebAssembly SIMD build. */
export type TtsKernel = 'avx512' | 'avx2' | 'sse41' | 'wasm';
/** 'auto' (default): the best native build this CPU runs, else wasm; 'native': a native build or an error; 'wasm'. */
export type NodeTtsBackend = 'auto' | 'native' | 'wasm';
export interface NodeLoadOptions {
    /** With model: the directory that holds g2p/ (default: the package's own models/). With voice (the 1.0.0 layout): the
     *  directory with tts/own.{json,bin} and decoder/nsf.{json,bin} (default: ./models of the working directory). */
    modelsPath?: string;
    /** The voice (default 'marine'): 'marine' reads tts/ and decoder/, another id voices/<id>/tts/ and voices/<id>/decoder/
     *  under modelsPath (voiceDirs). */
    voice?: VoiceId;
    /** A voice packed in one file (.ztm, docs/ztm-format.md): a local path, or an http(s) URL (downloaded with fetch, e.g.
     *  ztmUrl('kikka')). The G2P is read from <modelsPath>/g2p/. Overrides voice. */
    model?: string;
    /** default 'auto' */
    backend?: NodeTtsBackend;
    /** Force one native build: 'avx512' | 'avx2' | 'sse41' (also ZEN_TTS_KERNEL). */
    kernel?: Exclude<TtsKernel, 'wasm'>;
    /** Directory with the native builds zen_tts_<kernel>.node (default: native/x86/build of the package; also ZEN_TTS_NATIVE_DIR). */
    nativeDir?: string;
    /** Default of the speak option `numbers`: 'rule' (default) or 'model'. A speak() / analyze() option overrides it. */
    numbers?: NumberReading;
}
/** speak()'s result: the audio and what the model read. */
export interface NodeSpeakResult extends OwnSpeakResult {
    /** The audio (mono float32 in [-1, 1]); the same array as `audio`. */
    pcm: Float32Array;
    sampleRate: number;
}
/** One sentence of speakStream(). */
export interface NodeSpeechChunk {
    index: number;
    text: string;
    pcm: Float32Array;
    sampleRate: number;
    timing: OwnSpeakResult['timing'];
}
export declare class ZenTtsNode {
    private readonly tts;
    readonly kernel: TtsKernel;
    readonly voice: string;
    readonly header?: ZtmHeader | undefined;
    /** How long amounts and numbers before a unit are read when a call does not say (NodeLoadOptions.numbers). */
    numbers: NumberReading;
    private constructor();
    static load(o?: NodeLoadOptions): Promise<ZenTtsNode>;
    /** One sentence (up to about 11 s of speech) to 44.1 kHz mono audio. Synchronous work on this thread. */
    speak(text: string, o?: SpeakOptions): Promise<NodeSpeakResult>;
    /** speak() with the engine's options as they are (blend / blendAt, labels, f0Add, durScale). */
    speakWith(text: string, o: OwnSpeakOptions): Promise<NodeSpeakResult>;
    /**
     * A text of any length, one sentence at a time (splitSentences): yields each sentence's audio when it is made, so it
     * can be played, streamed or lip-synced while the next one is synthesised.
     */
    speakStream(text: string, o?: SpeakOptions): AsyncGenerator<NodeSpeechChunk>;
    /** Readings and accent marks the model would use (after the dictionary). */
    analyze(text: string, dict?: Parameters<CpuOwnTts['analyze']>[1], o?: {
        numbers?: NumberReading;
    }): ReturnType<CpuOwnTts['analyze']>;
    /** Bytes of the kernels' memory (weights + work). */
    get memoryBytes(): number;
    destroy(): void;
}
/** Mono float audio -> 16-bit PCM WAV bytes. */
export declare function wavBytes(pcm: Float32Array, sampleRate?: number): Uint8Array;

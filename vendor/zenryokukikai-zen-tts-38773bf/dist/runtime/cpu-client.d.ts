import type { EmotionBlend } from './emotion.js';
import type { OwnSpeakOptions, OwnSpeakResult } from './tts-own-device.js';
import type { DictWord, OwnDictEntry, OwnMeta } from './tts-own-prosody.js';
import type { NumberReading } from './ja-text-normalize.js';
export type CpuSpeakOptions = Omit<OwnSpeakOptions, 'stream' | 'blendAt'> & {
    curve?: EmotionBlend[];
};
export type CpuAnalysis = {
    norm: string;
    g2pText: string;
    unknown: string[];
    g2p: {
        phones: string[];
        marks: number[];
        spans: [number, number][];
    };
    phones: string[];
    marks: number[];
    words: DictWord[];
    aligned: boolean;
};
export type CpuRequest = {
    type: 'load';
    id: number;
    wasm: ArrayBuffer;
    meta: unknown;
    bin: ArrayBuffer;
    nsfMeta: unknown;
    nsfBin: ArrayBuffer;
} | {
    type: 'speak';
    id: number;
    text: string;
    options: CpuSpeakOptions;
} | {
    type: 'analyze';
    id: number;
    text: string;
    dict: OwnDictEntry[];
    numbers?: NumberReading;
};
export type CpuReply = {
    type: 'ready';
    id: number;
} | {
    type: 'spoken';
    id: number;
    result: OwnSpeakResult;
} | {
    type: 'analyzed';
    id: number;
    result: CpuAnalysis;
} | {
    type: 'error';
    id: number;
    message: string;
};
export declare class CpuTts {
    private readonly worker;
    readonly meta: OwnMeta;
    private seq;
    private readonly waiting;
    private constructor();
    private ask;
    /** wasmUrl: cpu/tts-cpu.wasm; modelsUrl: the directory with <set>/own.* and <decoderSet>/nsf.*. */
    static load(wasmUrl: string, modelsUrl: string, set: string, decoderSet: string): Promise<CpuTts>;
    /** The same from files already in memory (tts-cpu.wasm, own.json / own.bin, nsf.json / nsf.bin); the buffers are transferred. */
    static fromData(wasm: ArrayBuffer, meta: OwnMeta, bin: ArrayBuffer, nsfMeta: unknown, nsfBin: ArrayBuffer): Promise<CpuTts>;
    speak(text: string, o: Omit<OwnSpeakOptions, 'stream'>): Promise<OwnSpeakResult>;
    analyze(text: string, dict?: readonly OwnDictEntry[], _latin?: boolean, numbers?: NumberReading): Promise<CpuAnalysis>;
    destroy(): void;
}

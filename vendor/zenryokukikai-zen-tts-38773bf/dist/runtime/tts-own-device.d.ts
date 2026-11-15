import { WgslNsfDecoder, type NsfPcmChunk } from './nsf-wgsl.js';
import type { NsfExportMeta, NsfWeights } from './nsf-weights.js';
import { type EmotionBlend } from './emotion.js';
import { type NumberReading } from './ja-text-normalize.js';
import { predictorInput, type DictWord, type OwnDictEntry, type OwnDictSettings, type OwnMeta, type OwnProsody } from './tts-own-prosody.js';
type GpuDevice = any;
export interface OwnStreamOptions {
    blockFrames?: number;
    onChunk: (chunk: NsfPcmChunk & {
        genMs: number;
    }) => Promise<void>;
}
export interface OwnSpeakOptions {
    stream?: OwnStreamOptions;
    blend: EmotionBlend;
    /** strength of the model's F0 deviation outside dictionary words with a type (default 1) */
    strength?: number;
    dict?: readonly OwnDictEntry[];
    settings?: OwnDictSettings;
    /** romaji and short acronyms by rule, English words to the G2P in lower case (docs/SPEC-text-frontend.md §3); default true */
    latin?: boolean;
    /** long amounts and numbers before a unit (5+ digits): 'rule' (default) reads them by rule before the G2P (spec §1.5c),
     *  'model' leaves them to the G2P */
    numbers?: NumberReading;
    /** G2P labels to use instead of the G2P (e.g. high / low edited in a UI) */
    labels?: {
        phones: string[];
        marks: number[];
    };
    /** per phone (no edge) semitones added / duration factor, after everything (e.g. pitch / length edited in a UI) */
    f0Add?: number[];
    durScale?: number[];
    /** whole utterance: speaking-rate factor (1 = as predicted; durations / speed, pauses included) and semitones added
     *  to F0 (0 = as predicted); after the dictionary and f0Add / durScale (speak-rate.ts) */
    speed?: number;
    pitch?: number;
    /** 文の途中で変化: the blend at a position in the utterance (0 = start, 1 = end); unset: o.blend for the whole
     * utterance. Per phone in the predictor (style row + F0 template) and per frame in the generator (z mixed between runs
     * at CURVE_ANCHORS blends along the curve). Not combined with stream. */
    blendAt?: (x: number) => EmotionBlend;
}
export interface OwnSpeakResult {
    norm: string;
    /** chars that are not in the G2P's table (read as UNK) */
    unknown: string[];
    /** G2P output (before the dictionary) and the labels read */
    g2p: {
        phones: string[];
        marks: number[];
    };
    phones: string[];
    marks: number[];
    words: DictWord[];
    /** with the edge '_' at both ends */
    prosody: OwnProsody;
    f0: number[];
    dur: number[];
    audio: Float32Array;
    timing: {
        g2pMs: number;
        predMs: number;
        genMs: number;
        decoderMs: number;
        totalMs: number;
        frames: number;
        nan: number;
    };
}
export declare class WgslOwnTts {
    readonly device: GpuDevice;
    readonly meta: OwnMeta;
    private readonly bin;
    private readonly pipelines;
    private readonly buffers;
    private g2pSteps;
    private predSteps;
    private genSteps;
    private N;
    private P;
    private F;
    private readonly cid;
    private readonly punct;
    private readonly symbolId;
    private g2pIn;
    private g2pLogits;
    private g2pRead;
    private predIn;
    private predHead;
    private predRead;
    private predHidden;
    private frameIdx;
    private frameExtra;
    /** gen.inp's [scale | bias] buffer and its bias (the style blend is added to it per utterance) */
    private genSb;
    private z;
    decoder: WgslNsfDecoder;
    bytes: number;
    weightBytes: number;
    private constructor();
    /** Loads <modelsUrl>/<set>/own.{json,bin} and the NSF decoder <modelsUrl>/<decoderSet>/nsf.{json,bin}. */
    static load(device: GpuDevice, set: string, decoderSet: string, streaming?: boolean, modelsUrl?: string): Promise<WgslOwnTts>;
    /** The same from weights already in memory (own.json / own.bin as one, the decoder's converted weights and its nsf.json). */
    static fromData(device: GpuDevice, meta: OwnMeta, bin: ArrayBuffer, dec: {
        weights: NsfWeights;
        meta: NsfExportMeta;
    }, streaming?: boolean): Promise<WgslOwnTts>;
    private tensor;
    private f32;
    private buffer;
    private upload;
    private step;
    /** y (+)= act(x W + b): int8 (`.q` [I, O4 * 4], `.s`, `.b`) or fp16 (`.w` [I, O], `.b`). act 1 GELU, 2 ReLU; res 1 adds. */
    private lin;
    private norm;
    private build;
    private submit;
    private read;
    /** Char ids of normalized text (vocab index + 2; 1 = UNK). */
    charIds(norm: string): {
        ids: number[];
        unknown: string[];
    };
    /** G2P on char ids: logits [N, slots * (classes + marks)] and the argmax per slot [phones x slots | marks x slots]. */
    g2p(ids: readonly number[]): Promise<{
        logits: Float32Array;
        slots: number[][];
    }>;
    /** Predictor on [_ phones _]: hidden stays on the GPU for the generator; returns the head [P, 4]. */
    predict(input: ReturnType<typeof predictorInput>, blend: EmotionBlend, blendAt?: (x: number) => EmotionBlend): Promise<Float32Array>;
    /** Generator + decoder on frame rows (the predictor's hidden of the last predict()). */
    synth(pr: Pick<OwnProsody, 'dur' | 'f0' | 'energy' | 'voiced'>, blend: EmotionBlend, stream?: OwnStreamOptions, blendAt?: (x: number) => EmotionBlend): Promise<{
        audio: Float32Array;
        genMs: number;
        decoderMs: number;
        frames: number;
    }>;
    /** z rows F..T-1 = row F-1 (only for chunks under 3 frames). */
    private padZ;
    /** z [F, 192] of the last synth. */
    readZ(): Promise<Float32Array>;
    /** G2P labels of text (normalized, after dictionary L1): for showing / editing the readings and accents. */
    analyze(text: string, dict?: readonly OwnDictEntry[], latin?: boolean, numbers?: NumberReading): Promise<{
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
    }>;
    /** One sentence to audio (44.1 kHz). */
    speak(text: string, o: OwnSpeakOptions): Promise<OwnSpeakResult>;
    destroy(): void;
}
export {};

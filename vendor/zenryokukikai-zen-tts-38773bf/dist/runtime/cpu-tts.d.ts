import { type EmotionBlend } from './emotion.js';
import { type NumberReading } from './ja-text-normalize.js';
import { predictorInput, type DictWord, type OwnDictEntry, type OwnMeta, type OwnProsody } from './tts-own-prosody.js';
import type { OwnSpeakOptions, OwnSpeakResult } from './tts-own-device.js';
import { CpuKernels } from './cpu-kernels.js';
import { CpuNsfDecoder } from './cpu-nsf.js';
import type { NsfF0Norm, NsfWeights } from './nsf-weights.js';
export declare class CpuOwnTts {
    readonly k: CpuKernels;
    readonly meta: OwnMeta;
    private readonly bin;
    private readonly cid;
    private readonly symbolId;
    private readonly punct;
    private readonly g2pLn;
    private readonly g2pLayers;
    private readonly g2pHead;
    private readonly predLn;
    private readonly predLayers;
    private readonly predHead;
    private readonly genInp;
    private readonly genLayers;
    private readonly genNorm;
    private readonly genOut;
    readonly decoder: CpuNsfDecoder;
    /** the predictor's hidden [P, Dp] of the last predict() (scratch-free: kept for the generator) */
    private hidden;
    private constructor();
    /**
     * f0Norm: the decoder's log-F0 normalisation (nsfF0Norm of its nsf.json; omitted = 「全力 マリン」's).
     * outputGain: the decoder's output level (nsfOutputGain of its nsf.json; omitted = 1).
     */
    static create(wasm: ArrayBuffer | Uint8Array, meta: OwnMeta, bin: ArrayBuffer, nsf: NsfWeights, f0Norm?: NsfF0Norm, outputGain?: number): Promise<CpuOwnTts>;
    private tensor;
    private f32;
    /** As WgslOwnTts.lin: int8 `.q` [I, O4 * 4] with `.s`, or fp16 `.w` [I, O]; `.b`. */
    private lin;
    /** LN -> layers (attention, FFN as k-conv when kin > 1); x0 [T, D] in -> x [T, D] (scratch). */
    private encoder;
    g2p(ids: readonly number[]): number[][];
    predict(input: ReturnType<typeof predictorInput>, blend: EmotionBlend, blendAt?: (x: number) => EmotionBlend): Float32Array;
    /** z [F, 192] of frame rows (the hidden of the last predict()). */
    generate(pr: Pick<OwnProsody, 'dur' | 'f0' | 'energy' | 'voiced'>, blend: EmotionBlend): Float32Array;
    /** G2P labels of text (normalized, after dictionary L1), as WgslOwnTts.analyze. */
    analyze(text: string, dict?: readonly OwnDictEntry[], latin?: boolean, numbers?: NumberReading): {
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
    /** One sentence to audio (44.1 kHz): the same steps and options as WgslOwnTts.speak (no stream). */
    speak(text: string, o: Omit<OwnSpeakOptions, 'stream'>): OwnSpeakResult;
}

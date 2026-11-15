import { NSF, nsfExportToWeights, nsfF0Norm, nsfOutputGain, type NsfExportMeta, type NsfF0Norm, type NsfWeights } from './nsf-weights.js';
export { NSF, nsfExportToWeights, nsfF0Norm, nsfOutputGain, type NsfExportMeta, type NsfF0Norm, type NsfWeights };
type GpuDevice = any;
type GpuBuffer = any;
/** Deterministic random weights of the NSF shape (for the speed bench: weights do not change the time). */
export declare function randomNsfWeights(seed?: number): NsfWeights;
/** Fetches <base>.json and <base>.bin and converts them. */
export declare function loadNsfWeights(base: string): Promise<{
    weights: NsfWeights;
    meta: NsfExportMeta;
    binBytes: number;
}>;
/** The parts of a run, in order (the page's per-part times). */
export declare const NSF_PARTS: readonly ["f0z", "embed", "blocks", "head", "upsample", "source", "filter", "istft"];
export type NsfPart = typeof NSF_PARTS[number];
export declare const NSF_PART_LABEL: Record<NsfPart, string>;
export interface NsfRunOptions {
    /** frame F0 [T] Hz: used instead of f0z (f0z is skipped). */
    f0?: Float32Array;
    /** noise e_n [T * 512]: used instead of the shader's PCG noise. */
    noise?: Float32Array;
}
export declare class WgslNsfDecoder {
    readonly device: GpuDevice;
    readonly maxT: number;
    readonly seed: number;
    readonly outputGain: number;
    private readonly pipelines;
    private readonly buffers;
    private steps;
    private T;
    private noiseMode;
    /** noiseBranch 'direct' weights (head 5 * 1025) */
    private direct;
    private stream;
    private f0Cache;
    private zIn;
    private f0;
    private ex;
    private audio;
    private read;
    private f0Read;
    bytes: number;
    weightBytes: number;
    private constructor();
    static create(device: GpuDevice, weights: NsfWeights, maxT: number, seed?: number, f0Norm?: NsfF0Norm, outputGain?: number): Promise<WgslNsfDecoder>;
    static samples(T: number): number;
    /** The decoder's output at its voice's level (nsf.json outputGain; 1 = as the weights give it). */
    private level;
    private buffer;
    private upload;
    private step;
    private linearStep;
    /** embed conv + LN + ConvNeXt blocks of one net: input src [T, C] -> x [T, D] (h, a scratch). */
    private convnext;
    private build;
    /** z: written to the decoder's input here; null: the caller copies it in (runFromBuffer). */
    private prepare;
    private encode;
    /** z [T, zDim] -> audio [T * 512] and the frame F0 [T] used (one submit). */
    run(z: Float32Array, T: number, opt?: NsfRunOptions): Promise<{
        audio: Float32Array;
        f0: Float32Array;
    }>;
    /** The same on z [T, zDim] already in a GPU buffer (src rows from..from+T-1: the own TTS generator's output). */
    runFromBuffer(src: GpuBuffer, from: number, T: number, opt?: NsfRunOptions): Promise<{
        audio: Float32Array;
        f0: Float32Array;
    }>;
    private runEncoded;
    /**
     * Exact lookahead streaming of a non-causal model (not independent padded-window synthesis).
     * f0/excitation are global: oscillator prefix and PCG sample indices never reset. Trunk radius is
     * (embed + 8 blocks) * 3 = 27 frames. Global inverse-FFT frames retain the OLA tail; two future
     * filter frames are needed before a sample is final. The caller must keep src alive until done.
     */
    streamFromBuffer(src: GpuBuffer, T: number, blockFrames?: number, opt?: NsfRunOptions): AsyncGenerator<NsfPcmChunk>;
    /** The same run, one submit per part, each waited for: ms per part (the sum is a little over run()'s time). */
    profile(z: Float32Array, T: number, opt?: NsfRunOptions): Promise<Record<NsfPart, number>>;
    destroy(): void;
}
export interface NsfPcmChunk {
    audio: Float32Array;
    final: boolean;
    sampleStart: number;
    blockMs: number;
    prepareMs: number;
    firstMs: number;
    frames: number;
}
/** Yield through a complete rendering opportunity, including when called from an rAF callback. */
export declare function decoderRenderTurn(): Promise<void>;

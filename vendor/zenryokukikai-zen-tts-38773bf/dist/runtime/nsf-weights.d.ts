export declare const NSF: {
    readonly zDim: 192;
    readonly dim: 384;
    readonly ffDim: 1152;
    readonly layers: 8;
    readonly kernel: 7;
    readonly nFft: 2048;
    readonly bins: 1025;
    readonly hop: 512;
    readonly sampleRate: 44100;
    readonly lnEps: 0.000001;
    readonly maxMag: 100;
    /** cap of the noise gain exp(log G) for noiseBranch 'direct' (the training clamp) */
    readonly noiseMaxMag: 10000;
    readonly f0zDim: 192;
    readonly f0zFf: 576;
    readonly f0zLayers: 4;
};
/**
 * float32 weights, linear ones [in, out]. Keys `<p>embed.w` [7 * C, D] (row k * C + c), `<p>embed.b`, `<p>embed.norm`
 * [w | b], per block `<p><l>.dw` [dw w (D * 7) | dw b | ln w | ln b], `<p><l>.pw1.w|b`, `<p><l>.pw2.w|b` (gamma folded in),
 * then `final.norm`, `head.w` [384, 3075] (noiseBranch 'direct': [384, 5125]), `head.b` (p = '') and `f0z.out.w` [192, 2],
 * `f0z.out.b` (p = 'f0z.').
 */
export type NsfWeights = Record<string, Float32Array>;
export interface Net {
    prefix: string;
    C: number;
    D: number;
    F: number;
    layers: number;
}
export declare const TRUNK: Net;
export declare const F0Z: Net;
/** nsf.json: tensor table of nsf.bin (tensors under nsf. and f0z.), and the voice's log-F0 normalisation. */
export interface NsfExportMeta {
    dtype: 'fp16' | 'fp32';
    tensors: {
        name: string;
        shape: number[];
        offset: number;
        bytes: number;
    }[];
    /** mean of ln(F0 Hz) the decoder uses (trunk input and f0z output); omitted = DEFAULT_NSF_F0_NORM */
    logF0Mean?: number;
    /** its scale; omitted = DEFAULT_NSF_F0_NORM */
    logF0Std?: number;
    /**
     * Linear gain on the decoder output (omitted = 1). It normalises a voice's output level to the others' without
     * changing the weights; gain > 1 also enables the peak limiter (applyOutputLevel). hashiro: 2.8.
     */
    outputGain?: number;
    /**
     * How the decoder makes the noise part of the spectrum. Omitted: nsf.out has 3 * 1025 rows [log|H| | phase H | log G] and
     * the noise is G * STFT(white noise). 'direct' (1.2.0): nsf.out has 5 * 1025 rows [log|H| | phase H | log G | nx | ny]
     * and the noise spectrum is made directly, min(exp(log G), noiseMaxMag) * (nx, ny) / |(nx, ny)|, with no white noise.
     */
    noiseBranch?: 'direct';
    /** the cap of exp(log G) for noiseBranch 'direct'; must be NSF.noiseMaxMag when given */
    noiseMaxMag?: number;
}
/** Rows of nsf.out per frequency bin: 5 for noiseBranch 'direct', else 3. */
export declare function nsfHeadRows(meta: Pick<NsfExportMeta, 'noiseBranch' | 'noiseMaxMag'>): 3 | 5;
/** Whether decoder weights have the 'direct' noise head (head.b of 5 * 1025), else the white-noise one (3 * 1025). */
export declare function nsfDirectNoise(W: NsfWeights): boolean;
/** The decoder's F0 input / f0z output normalisation: x = (ln F0 - logF0Mean) / logF0Std. */
export interface NsfF0Norm {
    logF0Mean: number;
    logF0Std: number;
}
/** The value of the 「全力 マリン」 decoder (~229 Hz), used when nsf.json does not say. */
export declare const DEFAULT_NSF_F0_NORM: NsfF0Norm;
/** Plain multiplier on the decoder's output; the value when nsf.json does not say (the weights as they are). */
export declare const DEFAULT_NSF_OUTPUT_GAIN = 1;
/** Peak limiter of a raised voice: samples up to the knee pass unchanged, above it they bend smoothly towards the ceiling. */
export declare const NSF_LIMIT_KNEE = 0.8;
export declare const NSF_LIMIT_CEILING = 0.95;
/**
 * The decoder's output at its voice's level, in place. gain 1 returns the samples untouched. A raised voice (gain > 1)
 * also goes through a stateless soft limiter (|y| < NSF_LIMIT_CEILING), so a gain chosen for the quiet sentences does
 * not clip the loud ones; being per sample, it gives the same samples in one run and in streamed blocks.
 */
export declare function applyOutputLevel(audio: Float32Array, gain: number): Float32Array;
/** The output level of an nsf.json (its outputGain, else 1). */
export declare function nsfOutputGain(meta: Pick<NsfExportMeta, 'outputGain'>): number;
/** The normalisation of an nsf.json (its logF0Mean / logF0Std, else the default). */
export declare function nsfF0Norm(meta: Pick<NsfExportMeta, 'logF0Mean' | 'logF0Std'>): NsfF0Norm;
/** nsf.json tensors -> NsfWeights. */
export declare function nsfExportToWeights(meta: NsfExportMeta, bin: ArrayBuffer): NsfWeights;

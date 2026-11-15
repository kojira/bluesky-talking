import { CpuKernels } from './cpu-kernels.js';
import { type NsfF0Norm, type NsfWeights } from './nsf-weights.js';
export interface CpuNsfOptions {
    f0?: Float32Array;
    noise?: Float32Array;
}
export declare class CpuNsfDecoder {
    private readonly k;
    readonly seed: number;
    readonly f0Norm: NsfF0Norm;
    readonly outputGain: number;
    private readonly f0z;
    private readonly f0zOut;
    private readonly trunk;
    private readonly finalNorm;
    private readonly head;
    /** noiseBranch 'direct' (head 5 * 1025, no white noise), else the white-noise decoder */
    private readonly direct;
    /** cos (2048) | sin (2048) of 2 pi k / 2048 */
    private readonly tab;
    constructor(k: CpuKernels, W: NsfWeights, seed?: number, f0Norm?: NsfF0Norm, outputGain?: number);
    /** embed conv + LN + ConvNeXt blocks: src [T, C] -> x [T, D] (in scratch). */
    private convnext;
    /** z [T, 192] -> audio [T * 512] and the frame F0 [T]. */
    run(z: Float32Array, T: number, opt?: CpuNsfOptions): {
        audio: Float32Array;
        f0: Float32Array;
        ms: Record<string, number>;
    };
}

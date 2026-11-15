/** The kernels, in the order of the native addon's ids (native/x86/addon.c: call(id, buffer, ...args)). */
export declare const KERNELS: readonly ["lin_f32", "lin_p16", "lin_i8", "im2col", "dw_norm", "vattn", "frame_in", "nsf_exc", "nsf_stft", "nsf_istft", "nsf_ola", "nsf_stft_direct"];
export type KernelName = typeof KERNELS[number];
/** A native build of native/tts-cpu.c (Node addon): runs kernel `id` on the bytes of `buffer` with the wasm kernel's arguments. */
export interface NativeKernels {
    call(id: number, buffer: ArrayBuffer, ...args: number[]): void;
}
/**
 * A linear layer in the kernel's layout: w int8 or float32 [I, O4 * 4], or 'p16' (fp16 weights decoded to float32 once at
 * load and packed in panels of 16 outputs for lin_p16); scale and bias O4 * 4 floats each.
 */
export interface CpuLinear {
    kind: 'i8' | 'f32' | 'p16';
    w: number;
    scale: number;
    bias: number;
    I: number;
    O: number;
    O4: number;
}
export declare class CpuKernels {
    private readonly memory;
    /**
     * int8 layers converted to float32 panels at load (lin_p16, bit-identical to lin_i8): about 2-3% faster on one core,
     * but the wasm memory grows 47 -> 73 MB, so off by default (phones).
     */
    static i8Panels: boolean;
    private top;
    private readonly fn;
    /** bytes of weights put (put*()) */
    weightBytes: number;
    private constructor();
    /** bytes: cpu/tts-cpu.wasm. Throws where WebAssembly SIMD is missing. */
    static create(bytes: ArrayBuffer | Uint8Array): Promise<CpuKernels>;
    /**
     * Node only: run every kernel in a native build of the same C source (native/x86) on this memory, with the same
     * arguments (byte offsets into the memory). The memory stays the wasm one (put / alloc / views are unchanged).
     */
    useNative(addon: NativeKernels): void;
    /** bytes of the memory now */
    get bytes(): number;
    /** n bytes (16-aligned) above everything allocated so far; the memory grows when needed. */
    alloc(n: number): number;
    /** Runs f with allocations above the current top, then releases them (f's views must not be kept). */
    scratch<T>(f: () => T): T;
    /** A float32 view (made again after every alloc: a grown memory has a new buffer). */
    f32(p: number, n: number): Float32Array;
    put(data: ArrayBufferView): number;
    /** A uint32 view. */
    u32(p: number, n: number): Uint32Array;
    /** float32 n floats; with data copied in. */
    floats(n: number, data?: Float32Array): number;
    /**
     * A linear layer (scale: per output column, 1 for fp16 / float32; bias O). w: int8 [I, O4 * 4] as stored, fp16 bits or
     * float32 [I, O] (rows padded here to O4 * 4, as packLinear / WgslOwnTts.lin).
     */
    linear(kind: 'i8' | 'f16' | 'f32', w: Int8Array | Uint16Array | Float32Array, I: number, O: number, bias: Float32Array, scale?: Float32Array): CpuLinear;
    /** y [T, O4 * 4] (+)= act(scale * x W + bias); x [T, I]; act 1 GELU, 2 ReLU; res 1 adds to y. */
    lin(L: CpuLinear, x: number, T: number, y: number, act?: number, res?: number, bias?: number): void;
    /** col [T, K * C]: col[t, k * C + c] = x[t + k - K / 2, c] (0 outside). */
    im2col(x: number, T: number, C: number, K: number, col: number): void;
    /** y [T, D] = LayerNorm(conv ? dwconv_K(x) : x); prm as DW_NORM's. */
    dwNorm(x: number, T: number, D: number, K: number, conv: boolean, prm: number, y: number, eps: number): void;
    /** o [T, H * DH] = VITS relative attention of qkv [T, 3 * H * DH] (window W). */
    vattn(qkv: number, T: number, H: number, DH: number, W: number, relk: number, relv: number, o: number): void;
    /** y [F, D + 4] = [h[idx[f]] | extra[f]] (FRAME_IN). */
    frameIn(idx: number, F: number, D: number, h: number, extra: number, y: number): void;
    /** The NSF decoder's signal kernels (nsf-wgsl.ts EXC_*, STFT_FILTER, ISTFT, OLA). */
    readonly nsf: NsfKernels;
}
export interface NsfKernels {
    /** ex [T * 512, 2] = (e_h, e_n) from frame f0 [T]; noise false: e_n as already written. */
    exc(f0: number, T: number, noise: boolean, seed: number, ex: number): void;
    /** Y [nT, 1025] complex of frames t0.. (head rows from headOff); tab: cos | sin of 2 pi k / 2048. */
    stft(ex: number, N: number, t0: number, nT: number, s: number, O: number, headOff: number, maxMag: number, Y: number, tab: number): void;
    /** stft for noiseBranch 'direct' (head rows [log|H| | phase H | log G | nx | ny]): only e_h is read; noise = min(exp(log G), noiseMax) (nx, ny) / |(nx, ny)|. */
    stftDirect(ex: number, N: number, t0: number, nT: number, s: number, O: number, headOff: number, maxMag: number, noiseMax: number, Y: number, tab: number): void;
    istft(Y: number, t0: number, nT: number, frames: number, fbase: number, tab: number): void;
    ola(frames: number, fbase: number, T: number, o0: number, count: number, y: number, tab: number): void;
}

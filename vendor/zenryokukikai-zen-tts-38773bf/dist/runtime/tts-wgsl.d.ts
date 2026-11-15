export type TtsWeightFormat = 'fp16' | 'int8';
export declare const STORAGE = 128;
export declare const UNIFORM = 64;
export declare const COPY_DST = 8;
export declare const COPY_SRC = 4;
export declare const MAP_READ = 1;
export declare const WG = 64;
/** Rows of x one linear workgroup multiplies with the same 4 weight columns. */
export declare const ROWS = 8;
export declare const GELU = "\nfn erf1(v: f32) -> f32 {\n  // Abramowitz-Stegun 7.1.26 (|error| < 1.5e-7)\n  let a = abs(v);\n  let t = 1.0 / (1.0 + 0.3275911 * a);\n  let y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-a * a);\n  return select(-y, y, v >= 0.0);\n}\nfn gelu(v: f32) -> f32 { return 0.5 * v * (1.0 + erf1(v * 0.70710678118654752)); }";
/** Weight read of the linear shader: 4 consecutive outputs o4 of input row i, before the column scale. */
export declare const WEIGHT_READ: Record<TtsWeightFormat, string>;
/**
 * y[t, o] (+)= act(scale[o] * sum_i x[t, i] w[i, o] + bias[o]); sb = [scale (O4 vec4) | bias (O4 vec4)]; act 1 GELU, 2 ReLU.
 * One workgroup = 4 outputs x ROWS rows; its 64 threads split i and add their sums in workgroup memory.
 */
export declare const linear: (f: TtsWeightFormat) => string;
/** Embed conv as a matrix product: col[t, k * C + c] = x[t + k - K/2, c] (0 outside 0..T-1). */
export declare const IM2COL = "\nstruct P { T: u32, C: u32, K: u32 }\n@group(0) @binding(0) var<uniform> p: P;\n@group(0) @binding(1) var<storage, read> x: array<f32>;\n@group(0) @binding(2) var<storage, read_write> col: array<f32>;\n@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) g: vec3<u32>) {\n  let n = g.x + g.y * 65535u * 64u;\n  let W = p.K * p.C;\n  if (n >= p.T * W) { return; }\n  let t = i32(n / W);\n  let k = (n % W) / p.C;\n  let c = n % p.C;\n  let tt = t + i32(k) - i32(p.K / 2u);\n  col[n] = select(0.0, x[u32(max(tt, 0)) * p.C + c], tt >= 0 && tt < i32(p.T));\n}";
/**
 * One workgroup per frame t: y[t] = LayerNorm(conv ? dwconv(x)[t] : x[t]).
 * prm = [dw weight (D * K) | dw bias (D) |] ln weight (D) | ln bias (D) (the conv part only when conv == 1).
 */
export declare const DW_NORM = "\nstruct P { T: u32, D: u32, K: u32, conv: u32, eps: f32 }\n@group(0) @binding(0) var<uniform> p: P;\n@group(0) @binding(1) var<storage, read> x: array<f32>;\n@group(0) @binding(2) var<storage, read> prm: array<f32>;\n@group(0) @binding(3) var<storage, read_write> y: array<f32>;\nvar<workgroup> red: array<f32, 64>;\nfn total(v: f32, li: u32) -> f32 {\n  red[li] = v;\n  workgroupBarrier();\n  for (var k = 32u; k > 0u; k >>= 1u) {\n    if (li < k) { red[li] += red[li + k]; }\n    workgroupBarrier();\n  }\n  let s = red[0];\n  workgroupBarrier();\n  return s;\n}\n@compute @workgroup_size(64) fn main(@builtin(workgroup_id) wg: vec3<u32>, @builtin(local_invocation_index) li: u32) {\n  let t = wg.x;\n  let D = p.D;\n  let ln = select(0u, D * p.K + D, p.conv == 1u);\n  var s = 0.0;\n  for (var c = li; c < D; c += 64u) {\n    var v = 0.0;\n    if (p.conv == 1u) {\n      v = prm[D * p.K + c];\n      for (var k = 0u; k < p.K; k++) {\n        let tt = i32(t) + i32(k) - i32(p.K / 2u);\n        if (tt >= 0 && tt < i32(p.T)) { v += prm[c * p.K + k] * x[u32(tt) * D + c]; }\n      }\n    } else { v = x[t * D + c]; }\n    y[t * D + c] = v;\n    s += v;\n  }\n  let mean = total(s, li) / f32(D);\n  var q = 0.0;\n  for (var c = li; c < D; c += 64u) { let d = y[t * D + c] - mean; q += d * d; }\n  let r = inverseSqrt(total(q, li) / f32(D) + p.eps);\n  for (var c = li; c < D; c += 64u) { y[t * D + c] = (y[t * D + c] - mean) * r * prm[ln + c] + prm[ln + D + c]; }\n}";
/** A linear weight [I, O] (O padded to a multiple of 4) in the shader's format, and its per-column scale. */
export declare function packLinear(w: Float32Array, I: number, O: number, f: TtsWeightFormat): {
    data: Uint32Array;
    scale: Float32Array;
    O4: number;
};
/** u32 fields (and f32 ones where given as {f: value}) of a uniform struct, padded to 16 bytes. */
export declare function uniformData(fields: (number | {
    f: number;
})[]): ArrayBuffer;

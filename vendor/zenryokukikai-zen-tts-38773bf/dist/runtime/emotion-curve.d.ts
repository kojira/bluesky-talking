import { type EmotionBlend } from './emotion.js';
export declare const TTS_DEMO_MAX_TEXT = 300;
/** Slider values (0..100 per emotion, emotionNames order) -> the blend the model gets. */
export declare function ttsDemoBlend(percents: readonly number[]): EmotionBlend;
/** Text from the page -> trimmed, at most TTS_DEMO_MAX_TEXT characters; '' when nothing is left. */
export declare function ttsDemoText(value: unknown): string;
/** The 「文の途中で変化」 curve shapes, in the order the page shows them. */
export declare const TTS_DEMO_CURVES: readonly ["ease", "linear", "fast-start", "late-surge", "switch", "steps", "hill", "valley", "wave"];
export type TtsDemoCurve = (typeof TTS_DEMO_CURVES)[number];
/** The page's name of each curve. */
export declare const TTS_DEMO_CURVE_LABEL: Record<TtsDemoCurve, string>;
export declare function isTtsDemoCurve(v: unknown): v is TtsDemoCurve;
/**
 * How far the blend has moved from start (0) to end (1) at u, the position inside the change range (0..1). The
 * one-way curves go 0 -> 1 without turning back; 山なり goes 0 -> 1 -> 0, 谷 1 -> 0 -> 1, 揺れ swings 0 <-> 1 and ends at 1.
 */
export declare function ttsDemoCurveShape(curve: TtsDemoCurve, u: number): number;
/**
 * 「文の途中で変化」: the blend at position x (0 = start of the text, 1 = end). Between from and
 * to (fractions of the text) it follows the curve's shape; before from it holds the shape's first value, after to its last.
 */
export declare function ttsDemoCurveBlend(start: EmotionBlend, end: EmotionBlend, curve: TtsDemoCurve, from: number, to: number): (x: number) => EmotionBlend;

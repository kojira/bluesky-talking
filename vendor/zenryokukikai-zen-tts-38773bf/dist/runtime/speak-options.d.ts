import { type NumberReading } from './ja-text-normalize.js';
import { type EmotionBlend, type EmotionName } from './emotion.js';
import { type TtsDemoCurve } from './emotion-curve.js';
import type { OwnSpeakOptions } from './tts-own-device.js';
import type { OwnDictEntry, OwnDictSettings } from './tts-own-prosody.js';
/** Relative amounts per emotion (any non-negative numbers; only their ratio matters). Missing = 0; all 0 = neutral. */
export type EmotionAmounts = Partial<Record<EmotionName, number>>;
/** Emotion amounts -> the blend the model takes (weights summing to 1). */
export declare function emotionBlend(amounts: EmotionAmounts | EmotionBlend | undefined): EmotionBlend;
export interface SpeakOptions {
    /** The emotion (start emotion when `change` is given). */
    emotion?: EmotionAmounts;
    /** 文の途中で変化: change from `emotion` to `to` along the sentence with a curve shape over [from, to] of the text (0..1). */
    change?: {
        to: EmotionAmounts;
        curve?: TtsDemoCurve;
        from?: number;
        until?: number;
    };
    /** Scale of the model's intonation (F0 deviation): 1 = default, 0.5..2 is useful. */
    strength?: number;
    /** Reading / intonation dictionary entries. */
    dict?: readonly OwnDictEntry[];
    settings?: OwnDictSettings;
    /** Romaji and short acronyms by rule (arigatou → ありがとう, SDK → エスディーケー; English words go to the G2P in lower case);
     *  default true. false: Latin letters go to the G2P as written. */
    latin?: boolean;
    /** Long amounts and numbers before a unit (5+ digits, e.g. 88866円, 12,345,678円, 88866メートル): 'rule' reads them by rule
     *  (the default, or the load option), 'model' leaves them to the reading model. */
    numbers?: NumberReading;
    /** Speaking rate: 1 = as the model predicts, 1.5 = 1.5 times as fast (all durations / speed, pauses included).
     *  0.5..1.5 (outside: RangeError). */
    speed?: number;
    /** Pitch: semitones added to the whole utterance (0 = as predicted). -6..12 (outside: RangeError). */
    pitch?: number;
}
/** SpeakOptions -> the engine's options (blend, and blendAt for `change`). */
export declare function engineOptionsOf(o: SpeakOptions): OwnSpeakOptions;
/**
 * Points of a blendAt curve on the CPU path: a function cannot be posted to the browser's CPU worker, so it is sampled
 * at CURVE_POINTS points and read back linearly (curveFn). The Node entry does the same, so both CPU paths give the same
 * audio for a `change`.
 */
export declare const CURVE_POINTS = 129;
export declare function curvePoints(blendAt: (x: number) => EmotionBlend): EmotionBlend[];
export declare function curveFn(points: readonly EmotionBlend[]): (x: number) => EmotionBlend;
/**
 * Text -> sentences for speakStream(): split after 。！？!? (kept with their sentence) and at line breaks; each piece is
 * at most maxChars characters (a longer one is cut after its last 、，, or space before the limit, else at the limit).
 * One sentence of speech should stay under about 11 s (the engine's limit per call).
 */
export declare function splitSentences(text: string, maxChars?: number): string[];

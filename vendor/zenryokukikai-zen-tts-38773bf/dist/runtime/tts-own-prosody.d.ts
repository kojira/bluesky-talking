import { type EmotionBlend } from './emotion.js';
import { kanaToPhones } from './kana-phones.js';
export { kanaToPhones };
/** own.json (the parts the CPU steps use). */
export interface OwnMeta {
    shape: {
        g2p: {
            dim: number;
            layers: number;
            ff: number;
            heads: number;
            vocab: number;
            slots: number;
            phoneClasses: number;
            marks: number;
        };
        pred: {
            dim: number;
            layers: number;
            ff: number;
            heads: number;
            kernel: number;
            phones: number;
        };
        gen: {
            dim: number;
            ff: number;
            layers: number;
            kernel: number;
            extra: number;
            z: number;
        };
        window: number;
        lnEps: number;
        styles: number;
        sampleRate: number;
        hop: number;
    };
    vocab: string[];
    charPad: number;
    charUnk: number;
    symbols: string[];
    phoneClasses: string[];
    marks: string[];
    punctuation: string[];
    template: {
        B: number[];
        H: number[];
        D: number[];
    };
    /** the voice's F0 range per emotion (see DEFAULT_PITCH_RANGE); omitted = DEFAULT_PITCH_RANGE (「全力 マリン」) */
    pitchRange?: number[];
    kana: Record<string, [string, string]>;
    tensors: {
        name: string;
        dtype: 'i8' | 'f16' | 'f32';
        shape: number[];
        offset: number;
        bytes: number;
    }[];
}
/** Marks of a phone (the accent / phrase symbol after it in the prosody label string). */
export declare const MARK: {
    readonly none: 0;
    readonly rise: 1;
    readonly fall: 2;
    readonly phrase: 3;
    readonly pause: 4;
};
/**
 * The own dictionary's global settings : accentHeight = H of a word with an accent type, in semitones;
 * pitchRange = the speaker's F0 range (p90 - p10, semitones) per emotion in emotionNames order, what a contour value of 1
 * is worth (omitted: DEFAULT_PITCH_RANGE).
 */
export interface OwnDictSettings {
    accentHeight: number;
    pitchRange?: number[];
}
export declare const DEFAULT_OWN_DICT_SETTINGS: OwnDictSettings;
/** The voice's F0 range (p90 - p10, semitones) per emotion, in emotionNames order. */
export declare const DEFAULT_PITCH_RANGE: readonly number[];
/** The dictionary settings for a voice: the given ones (or the defaults), with the voice's pitchRange when they have none. */
export declare function voiceDictSettings(settings: OwnDictSettings | undefined, meta: Pick<OwnMeta, 'pitchRange'>): OwnDictSettings;
/** The F0 range (st) of a style: the blend's weighted mean of the per-emotion ranges (an all-zero blend = neutral). */
export declare function pitchRangeOf(blend: EmotionBlend, range?: readonly number[]): number;
/**
 * A relative contour on one word: phones a..b-1 (indices of f0, edges counted)
 * grouped into moras by moraEnds (phones after the last mora end are in none); level = the mean over all the word's
 * moras of each mora's mean F0; each mora k < values.length is shifted so its mean is level + values[k] * range (the
 * shape inside the mora kept), the others are kept. The level keeps the style's height and declination there,
 * range scales the shape to the style's spread.
 */
export declare function contourF0(f0: readonly number[], phones: readonly string[], a: number, b: number, values: readonly number[], range: number): number[];
/** Round half to even. */
export declare function roundHalfEven(v: number): number;
/** G2P argmax per char [phone x slots | mark x slots] -> phones, marks, per char [start, end) phone index. */
export declare function slotsToPhones(slots: number[][], meta: Pick<OwnMeta, 'phoneClasses'>, nSlots: number): {
    phones: string[];
    marks: number[];
    spans: [number, number][];
};
/**
 * The G2P was trained on sentences that end with punctuation (96% end with '.'); a text without it (「二色」, 「机」) is
 * read badly, even into a consonant with no vowel (「二色」 -> n i e o k). The G2P therefore reads such a text with a '.'
 * after it; the phones of that '.' are then dropped again, so the phones that follow are the same kind as before.
 */
export declare function withEndMark(text: string, punct: ReadonlySet<string>): {
    text: string;
    added: boolean;
};
/** slotsToPhones' result without the last char (the '.' withEndMark added). */
export declare function dropEndMark(g: {
    phones: string[];
    marks: number[];
    spans: [number, number][];
}): {
    phones: string[];
    marks: number[];
    spans: [number, number][];
};
/** Tones (high 1 / low 0) per phone from the accent marks (non-strict). */
export declare function tonesFromMarks(phones: readonly string[], marks: readonly number[], punct: ReadonlySet<string>): number[];
export interface AccentFeatures {
    tone: number[];
    nucleus: number[];
    boundary: number[];
    pos: number[];
}
/** Per phone: high, nucleus, first phone of an accent phrase, position 0..1 in its phrase. */
export declare function accentFeatures(phones: readonly string[], marks: readonly number[], punct: ReadonlySet<string>): AccentFeatures;
/** B, H, D of the template mixed by the blend (emotionNames order = the model's style order). */
export declare function templateParams(meta: Pick<OwnMeta, 'template'>, blend: EmotionBlend): {
    B: number;
    H: number;
    D: number;
};
export interface OwnProsody {
    /** with the edge '_' at both ends */
    phones: string[];
    marks: number[];
    acc: AccentFeatures;
    dur: number[];
    template: number[];
    dev: number[];
    f0: number[];
    energy: number[];
    voiced: number[];
}
/** [_ phones _] and their accent features (the predictor input besides the style). */
export declare function predictorInput(phones: readonly string[], marks: readonly number[], punct: ReadonlySet<string>): {
    phones: string[];
    marks: number[];
    acc: AccentFeatures;
};
/** The predictor head [P, 4] (log(dur + 1), F0 deviation st, energy, voiced logit) -> prosody. */
export declare function prosodyFromHead(input: ReturnType<typeof predictorInput>, head: Float32Array, meta: Pick<OwnMeta, 'template'>, blend: EmotionBlend, strength?: number): OwnProsody;
/** Per frame the phone index and [f0 / 12 (linear between phone centres), energy, position in the phone, voiced]. */
export declare function frameRows(pr: Pick<OwnProsody, 'dur' | 'f0' | 'energy' | 'voiced'>): {
    idx: Uint32Array;
    extra: Float32Array;
};
export interface OwnDictEntry {
    surface: string;
    /** katakana or hiragana */
    reading: string;
    /** 0 flat, n = fall after mora n; omitted: the G2P reads the reading */
    accent?: number;
    phrase?: 'split' | 'join';
    /** the model's F0 deviation in the word's accent phrase (0 = the type only) */
    strength?: number;
    /** relative F0 per mora (-3..3): F0 = the word's mean model F0 + value * the style's range (pitchRangeOf), before pitch */
    contour?: number[];
    /** semitones per mora, added */
    pitch?: number[];
    /** duration factor per mora */
    length?: number[];
    note?: string;
}
/** Morae of phones (indices of the phone that ends each mora). */
export declare function moraEnds(phones: readonly string[]): number[];
/** Accent type typ written into marks a..b-1: rise / fall cleared, then [ after mora 1 and ] after mora typ. */
export declare function setAccent(phones: readonly string[], marks: readonly number[], a: number, b: number, typ: number): number[];
/** Accent type of a..b-1 by its marks (0 flat). */
export declare function accentTypeOf(phones: readonly string[], marks: readonly number[], a: number, b: number): number;
/** Index after the accent phrase holding phone b - 1 (up to the next # or _ mark, inclusive). */
export declare function phraseEnd(marks: readonly number[], b: number): number;
/**
 * F0 of the accent phrase a..e-1 (phone indices without the edge '_') of a word with an accent type:
 * template with H = height, + the model's level (F0 - template with that H) linear from the phone before to the one after.
 * base: the prosody the phrase is joined to; edited: its marks' features. Returns the whole F0 (edge included).
 */
export declare function dictPhraseF0(base: Pick<OwnProsody, 'f0'>, edited: Pick<OwnProsody, 'acc'>, a: number, e: number, meta: Pick<OwnMeta, 'template'>, blend: EmotionBlend, height: number, strength?: number, dev?: readonly number[]): number[];
export interface DictMatch {
    entry: OwnDictEntry;
    /** char range in the text the G2P reads */
    start: number;
    end: number;
}
/**
 * L1 on normalized text: longest surface first, left to right; matched surfaces become their readings (katakana) in the
 * text the G2P reads (so it reads the word's context as usual). Returns that text and where each reading is.
 */
export declare function applyOwnDict(norm: string, entries: readonly OwnDictEntry[], latin?: boolean): {
    text: string;
    matches: DictMatch[];
};
export interface DictWord {
    entry: OwnDictEntry; /** phone range [a, b) (no edge) */
    a: number;
    b: number;
}
/**
 * L1 / L2 on the G2P output of applyOwnDict's text: a word with an accent type gets the mora table's phones and the
 * type's marks (a boundary before it when phrase is split); its rise / fall marks after it up to the phrase end are cleared.
 * aligned: every replaced word had the G2P's phone count (then the G2P's own prosody can hold the outside).
 */
export declare function dictLabels(g2p: {
    phones: string[];
    marks: number[];
    spans: [number, number][];
}, matches: readonly DictMatch[], kana: OwnMeta['kana']): {
    phones: string[];
    marks: number[];
    words: DictWord[];
    aligned: boolean;
};
/**
 * L3: the final F0 and durations. base: the prosody of the G2P's own labels (when aligned; else the dictionary run), its
 * F0 and durations kept outside the accent phrases of words with a type; dict: the prosody of the dictionary labels.
 */
export declare function dictProsody(base: OwnProsody, dict: OwnProsody, words: readonly DictWord[], meta: Pick<OwnMeta, 'template'>, blend: EmotionBlend, settings: OwnDictSettings): {
    f0: number[];
    dur: number[];
};
/** Prosody label string ("z e[ N ..."). */
export declare function labelString(phones: readonly string[], marks: readonly number[]): string;

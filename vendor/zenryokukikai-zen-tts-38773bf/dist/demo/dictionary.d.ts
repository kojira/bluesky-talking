import { type OwnDictEntry, type OwnMeta } from '../runtime/tts-own-prosody.js';
export declare const BROWSER_DICT_STORAGE_KEY = "zen-tts.dict.v2";
export declare const BROWSER_DICT_FORMAT = "zen-tts-dictionary";
export declare const BROWSER_DICT_MAX_ENTRIES = 500;
export declare class BrowserDictError extends Error {
}
/** One entry checked (trimmed; reading kana only; optional fields kept only when given and in range). */
export declare function validateDictEntry(x: unknown, row?: string): OwnDictEntry;
/** A list of entries checked: every entry valid, 表記 unique, at most BROWSER_DICT_MAX_ENTRIES. */
export declare function validateDictEntries(input: unknown): OwnDictEntry[];
/** The file written by 書き出す (and kept in localStorage). */
export interface BrowserDictFile {
    format: typeof BROWSER_DICT_FORMAT;
    version: 1;
    entries: OwnDictEntry[];
}
export declare function dictFile(entries: readonly OwnDictEntry[]): BrowserDictFile;
/** Text of a dictionary file (or the stored value) -> its entries; a bare list of entries is accepted too. */
export declare function parseDictFile(text: string): OwnDictEntry[];
/** add on top of base: the same 表記 is replaced (in place), new ones appended. Throws when the result is too long. */
export declare function mergeDictEntries(base: readonly OwnDictEntry[], add: readonly OwnDictEntry[]): {
    entries: OwnDictEntry[];
    added: number;
    replaced: number;
};
/** One sound (mora) of the sentence, or one punctuation mark. a..b-1: its phones (no edge '_'). */
export interface SoundUnit {
    /** katakana; a long vowel is its kana + ー */
    kana: string;
    punct: boolean;
    a: number;
    b: number;
    /** accent phrase index (a new one after a phrase / pause mark and after punctuation) */
    phrase: number;
}
/** The G2P's phones / marks -> sounds with their kana and accent phrase. */
export declare function soundUnits(phones: readonly string[], marks: readonly number[], kana: OwnMeta['kana'], punct: ReadonlySet<string>): SoundUnit[];
/** Katakana with long vowels written ー (コウ, コオ and コー all become コー; ケイ and ケー become ケー), to compare readings. */
export declare function readingKey(s: string, kana: OwnMeta['kana']): string;
/** Where a reading (hiragana / katakana) is in the sentence's sounds: the unit indices of its sounds, or undefined. */
export declare function findReadingUnits(units: readonly SoundUnit[], reading: string, kana: OwnMeta['kana']): number[] | undefined;
/** The phone range [a, b) of an accent phrase (its sounds, punctuation excluded); undefined when it has none. */
export declare function phraseRange(units: readonly SoundUnit[], phrase: number): [number, number] | undefined;
/** 下がる位置 of every phrase as the G2P read it (0 = 下がらない, n = after its n-th sound); punctuation-only phrases are -1. */
export declare function phraseAccents(units: readonly SoundUnit[], phones: readonly string[], marks: readonly number[]): number[];
/** The panel's edits of one sentence: 下がる位置 per phrase (null = as read), 高さ (semitones) and 長さ (factor) per sound. */
export interface SoundEdits {
    accent: (number | null)[];
    pitch: number[];
    length: number[];
}
export declare function emptySoundEdits(units: readonly SoundUnit[]): SoundEdits;
export declare function hasEdits(e: SoundEdits): boolean;
/** The edits -> speak options: labels only when a 下がる位置 changed; f0Add / durScale per phone. */
export declare function speakOptionsOf(units: readonly SoundUnit[], phones: readonly string[], marks: readonly number[], e: SoundEdits): {
    labels?: {
        phones: string[];
        marks: number[];
    };
    f0Add?: number[];
    durScale?: number[];
};
/** Mean F0 (semitones) of each sound from the speak result's f0 (edges included); null for punctuation. */
export declare function soundPitch(units: readonly SoundUnit[], f0WithEdges: readonly number[]): (number | null)[];
/**
 * 辞書に登録: one word (its sounds idx in the sentence) -> an entry with its reading and always its pitch shape:
 * contour = the made voice's pitch of its sounds about their own mean / the style's range. When read, it is put back on
 * the model's level there and scaled to the range of whatever emotion it is read with, so the shape is relative and
 * applies on top of any emotion and position. length: the word's 長さ (base: the entry the sentence was read with, its
 * lengths are in the made voice already, so the edits multiply them). base's accent / phrase / strength / note are
 * kept; its pitch (semitones added) is in the made pitch, so it is dropped.
 */
export declare function wordEntryOf(surface: string, reading: string, units: readonly SoundUnit[], idx: readonly number[], edits: SoundEdits, madePitch: readonly (number | null)[], range: number, base?: OwnDictEntry): OwnDictEntry;
/** The y of each sound of an entry's pitch sketch (its contour; undefined when it has none), and where it falls the most. */
export declare function contourSketch(e: OwnDictEntry): {
    values: number[];
    fallAfter: number;
} | undefined;
/** A short id of entries (the dictionary's version). */
export declare function dictVersionOf(entries: readonly OwnDictEntry[]): string;
/** A dictionary contour for a word from relative values of its moras: about their own mean, rounded to 0.001 and
 *  clamped to -3..3. */
export declare function wordContour(rel: readonly number[]): number[];

/** Mora table: katakana spelling (1 or 2 chars) -> [consonant or '', vowel / N / q]. */
export type MoraTable = Readonly<Record<string, readonly [string, string]>>;
/** Hiragana (U+3041..U+3096, ゝ, ゞ) -> katakana; every other character unchanged. */
export declare function hiraganaToKatakana(s: string): string;
/** Phonemes of a kana reading; the long-vowel mark repeats the previous phoneme. Throws on a character not in the table. */
export declare function kanaToPhones(reading: string, kana: MoraTable): string[];

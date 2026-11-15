/** Reads one numeral (digits, optionally `.digits`) in Japanese kanji. Throws when `s` is not a numeral. */
export declare function numberToKanji(s: string): string;
/** Phone numbers and postal codes -> katakana digit names, groups joined by 、 (spec §1.5b). */
export declare function readDigitNumbers(s: string): string;
/** Amounts in kanji numerals (spec §1.5c). */
export declare function readAmounts(s: string): string;
/** Currency amounts in katakana (spec §1.5c). */
export declare function readCurrencyAmounts(s: string): string;
/** Numbers of 5 digits or more right before a unit of UNIT_RULES, in katakana (spec §1.5c). */
export declare function readLongUnitNumbers(s: string): string;
/** How long amounts and numbers before a unit (5+ digits) are read: 'rule' (spec §1.5c, the default) or 'model' (the G2P). */
export type NumberReading = 'rule' | 'model';
export declare const NUMBER_READINGS: readonly NumberReading[];
/** The speak option `numbers` -> normalizeOwnText's `amounts`. */
export declare function numbersToAmounts(n: NumberReading | undefined): 'kana' | false;
export interface NormalizeOptions {
    /** romaji and short acronyms by rule, English to lower case (spec §3); default true. false: Latin letters as written. */
    latin?: boolean;
    /** currency amounts and long numbers before a unit (spec §1.5c): 'kana' by rule (readCurrencyAmounts, readLongUnitNumbers),
     *  'kanji' numerals (readAmounts, comparison only); default off here (the engines pass the speak option `numbers`) */
    amounts?: 'kana' | 'kanji' | false;
}
/**
 * Japanese text -> the character set the G2P model reads (spec §1). Digits stay digits: the G2P (1.2.0 and later) reads
 * numbers itself (10分 ジュップン, 十分 ジュウブン, 3分の2 サンブンノニ). Before it: thousand separators are dropped,
 * a currency sign moves after the number ($5 -> 5ドル), a range between numbers is から (1〜3 -> 1から3), % is パーセント
 * and a decimal point between digits is 点 (3.14 -> 3点14), as in the training data. Phone numbers and postal codes
 * (090-1234-5678, 〒123-4567) are read digit by digit by rule (readDigitNumbers).
 */
export declare function normalizeOwnText(text: string, o?: NormalizeOptions): string;

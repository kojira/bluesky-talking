/**
 * A lower-case word -> hiragana when the whole word is romaji, else undefined. Rules (spec §3.4): syllables longest
 * first; n before a consonant, an apostrophe or the end is ん (nn before a consonant is one ん); m before b / p / m is ん;
 * a doubled consonant (and tch) is っ; oh before a consonant or the end is おお.
 */
export declare function romajiToHiragana(word: string): string | undefined;
/** acronym: spelled with the letter names; romaji: hiragana; english: passed to the G2P as written. */
export type LatinKind = 'acronym' | 'romaji' | 'english';
/** A run spelled with the letter names (the - and ' inside are dropped): SDK -> エスディーケー. */
export declare function spellLetters(run: string): string;
export interface LatinReading {
    text: string;
    kind: LatinKind;
}
/**
 * One run of letters (with - or ' inside, no other characters) -> how it is read (spec §3.3):
 * 1. all upper case, up to 3 letters: an acronym, spelled with the letter names (SDK エスディーケー, VR ブイアール);
 * 2. romaji (hiragana), for a run of 2 letters or more that parses completely as romaji and is not in the romaji exclusion
 *    list (sushi すし, Yamada やまだ, SUSHI すし; game, nose, again are English);
 * 3. else English: passed to the G2P in lower case (unity, anthropic, html, iphone, wi-fi), as the reading model was
 *    trained on English words (lower case, - and ' kept); the model reads it.
 */
export declare function readLatinRun(run: string): LatinReading;
/**
 * Text after NFKC (spec §3.2) -> the same text with each romaji run in hiragana and each short acronym spelled with the
 * letter names; English runs stay as written (the G2P reads them). A run touching a digit or a letter-like neighbour through
 * . @ / : _ and similar (a URL, a mail address, example.com, a_b) is kept as written. Text without Latin letters is
 * returned unchanged.
 */
export declare function readLatin(text: string): string;
/** Macrons and circumflexes on vowels (Tōkyō, Ōsaka, kâ) -> long vowels in romaji (ou, oo, aa, ...), before NFKC. */
export declare function foldLongVowels(text: string): string;

import type { OwnDictEntry } from './tts-own-prosody.js';
export declare const BUILTIN_DICT: readonly OwnDictEntry[];
/** The built-in entries whose surface the user's dictionary does not have, then the user's entries. */
export declare function withBuiltinDict(user?: readonly OwnDictEntry[]): OwnDictEntry[];

import { ZenTts, type Backend, type DictEntry, type EngineSpeakOptions, type NumberReading, type SpeakResult, type VoiceId } from '../index.js';
export declare const engineLoaded: () => ZenTts | undefined;
/** The page's voice (the 声 radio: marine / hashiro / kai / kikka). */
export declare function pageVoiceId(): VoiceId;
/** The TTS on the chosen backend with the page's voice (loaded once per backend and voice; a failed load is tried again
 *  on the next call). */
export declare function loadEngine(backend: Backend): Promise<ZenTts>;
/** 「長い数字を決まりで読む」 (the speak option numbers): checked = 'rule', the runtime's default. */
export declare function pageNumbers(): NumberReading;
/** One utterance after another (the engine's buffers are shared). The dictionary is this browser's; over: one entry put
 *  over it for this run only (a 読み being tried in the intonation panel). */
export declare function speakQueued(backend: Backend, text: string, o: Omit<EngineSpeakOptions, 'dict' | 'settings'>, over?: DictEntry): Promise<SpeakResult & {
    sampleRate: number;
}>;
/** The text cut into sentences at 。！？ (and line breaks), never at 、; closing brackets stay with their sentence. */
export declare function splitSentences(text: string): string[];
/** Set when the stored value could not be read (it is left as it is until the user saves). */
export declare let browserDictProblem: string | undefined;
export declare function browserDict(): DictEntry[];
/** Saves the entries in this browser (throws BrowserDictError when the browser does not keep it). */
export declare function saveBrowserDict(entries: DictEntry[]): void;

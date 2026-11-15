export declare const VERSION = "1.3.0";
/** The default voice: 「全力 マリン」 (Zenryoku Marine). */
export declare const VOICE: {
    readonly id: "marine";
    readonly name: {
        readonly ja: "全力 マリン";
        readonly en: "Zenryoku Marine";
    };
    readonly model: "marine-1.2";
};
/** The four voices a models directory can hold. 'marine' is in tts/ and decoder/; the others in voices/<id>/tts/ and voices/<id>/decoder/. */
export declare const VOICES: {
    readonly marine: {
        readonly id: "marine";
        readonly name: {
            readonly ja: "全力 マリン";
            readonly en: "Zenryoku Marine";
        };
        readonly model: "marine-1.2";
    };
    readonly hashiro: {
        readonly id: "hashiro";
        readonly name: {
            readonly ja: "全力 ハシロウ";
            readonly en: "Zenryoku Hashiro";
        };
        readonly model: "hashiro-1.1";
    };
    readonly kai: {
        readonly id: "kai";
        readonly name: {
            readonly ja: "全力 カイ";
            readonly en: "Zenryoku Kai";
        };
        readonly model: "kai-1.1";
    };
    readonly kikka: {
        readonly id: "kikka";
        readonly name: {
            readonly ja: "全力 キッカ";
            readonly en: "Zenryoku Kikka";
        };
        readonly model: "kikka-1.1";
    };
};
export type VoiceId = keyof typeof VOICES;
/** The weight set directories of a voice, relative to the models directory. Throws on an unknown id. */
export declare function voiceDirs(voice?: VoiceId): {
    tts: string;
    decoder: string;
};
/** Where the voices of this release are published, one .ztm file per voice (docs/ztm-format.md). 1.3.0: the 1.2.2 voices with the new G2P's SHA-256 in the header (acoustic and vocoder bytes unchanged). */
export declare const ZTM_BASE_URL = "https://tts-models.zenryoku.work/v1.3.0/";
/** The CDN URL of a voice's .ztm (ZTM_BASE_URL + <id>.ztm). Throws on an unknown id. */
export declare function ztmUrl(voice?: VoiceId): string;

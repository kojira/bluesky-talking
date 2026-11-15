import { type Backend, type EmotionBlend } from '../index.js';
/** The page's voice settings now for the part a..b (0..1 by characters) of the text: the emotion mix (or, with 「文の途中で
 *  変化」, that part of the curve) and 抑揚の強さ. key changes whenever any of them changes. Used by 「話す」 and by the
 *  intonation panel (tune.ts), which listens to the 'tts-demo-voice' event on document. */
export declare function pageVoice(a?: number, b?: number): {
    blend: EmotionBlend;
    strength: number;
    speed: number;
    pitch: number;
    blendAt?: (x: number) => EmotionBlend;
    key: string;
};
/** speed / pitch for the engine: left out at their defaults, so the default output stays bit-identical. */
export declare function ratePitchOf(v: {
    speed: number;
    pitch: number;
}): {
    speed?: number;
    pitch?: number;
};
/** Where the voice is made (the page's radio: auto / webgpu / cpu). */
export declare function pageBackend(): Backend;
/** The backend the loaded engine really runs on, shown next to the radio. */
export declare function showBackend(): void;

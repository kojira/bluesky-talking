export declare const emotionNames: readonly ["neutral", "happy", "sad", "angry", "apologetic"];
export type EmotionName = typeof emotionNames[number];
/** Weights per emotion (each 0..1, sum 1). */
export type EmotionBlend = Readonly<Record<EmotionName, number>>;
export declare const neutralBlend: EmotionBlend;
/** Non-negative amounts per emotion (emotionNames order) -> a blend whose weights sum to 1. */
export declare function blendFrom(values: number[]): EmotionBlend;

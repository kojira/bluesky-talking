import type { NsfExportMeta } from './nsf-weights.js';
import type { OwnMeta } from './tts-own-prosody.js';
export declare const ZTM_MAGIC = "ZTM1";
export declare const ZTM_VERSION = 1;
export declare const ZTM_ALIGN = 64;
/** own.json fields that belong to the G2P / text frontend (shared by every voice); the rest are the voice's. */
export declare const G2P_META_KEYS: readonly ["vocab", "charPad", "charUnk", "phoneClasses", "marks", "punctuation", "kana"];
export declare const G2P_TENSOR_PREFIX = "g2p.";
type Tensor = OwnMeta['tensors'][number];
type NsfTensor = NsfExportMeta['tensors'][number];
/** <models>/g2p/g2p.json: the G2P tensors of g2p.bin (offsets from 0) and the frontend tables. */
export interface G2pMeta {
    format: 'zen-tts-g2p';
    version: 1;
    /** SHA-256 (hex) of g2p.bin */
    sha256: string;
    bytes: number;
    /** own.json shape.g2p */
    shape: OwnMeta['shape']['g2p'];
    vocab: string[];
    charPad: number;
    charUnk: number;
    phoneClasses: string[];
    marks: string[];
    punctuation: string[];
    kana: Record<string, [string, string]>;
    tensors: Tensor[];
}
export interface ZtmSection {
    offset: number;
    bytes: number;
    sha256: string;
}
export interface ZtmHeader {
    format: 'zen-tts-model';
    version: 1;
    /** model: the voice package version (e.g. marine-1.1; 1.2.0 and later) */
    voice: {
        id: string;
        name?: {
            ja?: string;
            en?: string;
        };
        model?: string;
    };
    /** style names in the order of the style rows (this runtime plays the five emotionNames only) */
    styles?: string[];
    created?: string;
    source?: Record<string, unknown>;
    /** the G2P the voice was built and checked with */
    g2p: {
        sha256: string;
        bytes: number;
    };
    /** own.json without the G2P fields and tensors; tensor offsets from the start of the acoustic section */
    acoustic: {
        meta: Record<string, unknown> & {
            shape: Record<string, unknown>;
        };
        tensors: Tensor[];
    };
    /** nsf.json without tensors; tensor offsets from the start of the vocoder section */
    vocoder: {
        meta: Omit<NsfExportMeta, 'tensors'> & Record<string, unknown>;
        tensors: NsfTensor[];
    };
    sections: {
        acoustic: ZtmSection;
        vocoder: ZtmSection;
    };
}
/** A parsed .ztm: the header and the whole file (sections are views into it). */
export interface Ztm {
    header: ZtmHeader;
    file: ArrayBuffer;
}
export declare function isZtm(file: ArrayBuffer): boolean;
/** Reads and checks the header (sizes and bounds; the SHA-256 of the sections is checked by verifyZtm where hashing is at hand). */
export declare function parseZtm(file: ArrayBuffer): Ztm;
/** The bytes of a section (a view, no copy). */
export declare function ztmSection(z: Ztm, name: 'acoustic' | 'vocoder'): Uint8Array;
/** A warning text when the voice was built with another G2P than the runtime's, else undefined. */
export declare function g2pMismatch(z: Ztm, g2p: Pick<G2pMeta, 'sha256'>): string | undefined;
/**
 * own.json + own.bin as the engines take them: the runtime's G2P bytes first, then the acoustic section, with the
 * tensor offsets of the legacy own.bin (G2P from 0, acoustic after it). One copy of both parts (~11 MB).
 */
export declare function ownFromZtm(z: Ztm, g2p: G2pMeta, g2pBin: ArrayBuffer): {
    meta: OwnMeta;
    bin: ArrayBuffer;
};
/** nsf.json + nsf.bin as the decoder takes them: the tensor offsets moved to the whole file (no copy of the weights). */
export declare function vocoderFromZtm(z: Ztm): {
    meta: NsfExportMeta;
    bin: ArrayBuffer;
};
export {};

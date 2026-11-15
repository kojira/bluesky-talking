/** The part of AudioContext used here. */
export interface ResumableContext {
    readonly state: string;
    resume(): Promise<void>;
    close(): Promise<void>;
}
export interface ReadyContext<C extends ResumableContext> {
    ctx: C;
    /** A new context was made: buffers decoded by the old one must be decoded again. */
    fresh: boolean;
    /** ctx.state is 'running': false means play through an <audio> element instead. */
    running: boolean;
}
export declare const RESUME_TIMEOUT_MS = 1500;
/** A context that is 'running' if the browser allows it: the current one resumed when it is not running; a new one
 *  when there is none, it is 'closed', or its resume failed (the old one is closed). Call from the tap handler. */
export declare function readyAudioContext<C extends ResumableContext>(current: C | undefined, make: () => C, timeoutMs?: number): Promise<ReadyContext<C>>;

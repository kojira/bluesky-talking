// Getting a Web Audio context ready to play inside a tap. iOS leaves a page's AudioContext 'interrupted' (not
// 'suspended') after the user comes back from another app, and it can also become 'closed'; resume() can then reject or
// never settle.
export const RESUME_TIMEOUT_MS = 1500;
/** Resume with a time limit: true when it resolved, false when it rejected or did not settle in time. */
async function tryResume(ctx, timeoutMs) {
    let timer;
    try {
        return await Promise.race([
            ctx.resume().then(() => true, () => false),
            new Promise((r) => { timer = setTimeout(() => r(false), timeoutMs); }),
        ]);
    }
    finally {
        if (timer !== undefined)
            clearTimeout(timer);
    }
}
/** A context that is 'running' if the browser allows it: the current one resumed when it is not running; a new one
 *  when there is none, it is 'closed', or its resume failed (the old one is closed). Call from the tap handler. */
export async function readyAudioContext(current, make, timeoutMs = RESUME_TIMEOUT_MS) {
    let ctx = current;
    let fresh = false;
    if (!ctx || ctx.state === 'closed') {
        ctx = make();
        fresh = true;
    }
    if (ctx.state === 'running')
        return { ctx, fresh, running: true };
    const ok = await tryResume(ctx, timeoutMs);
    if ((!ok || ctx.state === 'closed') && !fresh) {
        void ctx.close().catch(() => { });
        ctx = make();
        fresh = true;
        if (ctx.state !== 'running')
            await tryResume(ctx, timeoutMs);
    }
    return { ctx, fresh, running: ctx.state === 'running' };
}

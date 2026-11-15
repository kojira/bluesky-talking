interface Fs {
    readFileSync(p: string): Uint8Array;
    existsSync(p: string): boolean;
}
interface Path {
    join(...p: string[]): string;
    resolve(...p: string[]): string;
    dirname(p: string): string;
}
interface ModuleApi {
    createRequire(from: string): (id: string) => unknown;
}
interface UrlApi {
    fileURLToPath(u: string | URL): string;
}
interface Proc {
    platform: string;
    arch: string;
    env: Record<string, string | undefined>;
    versions: {
        node?: string;
    };
}
export interface NodeApis {
    fs: Fs;
    path: Path;
    module: ModuleApi;
    url: UrlApi;
    process: Proc;
}
/** node:fs, node:path, node:module, node:url and process (throws outside Node). */
export declare function nodeApis(): Promise<NodeApis>;
export {};

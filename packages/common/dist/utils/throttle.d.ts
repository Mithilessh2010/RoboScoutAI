export declare const throttled: <T extends any[], U>(fn: (...args: T) => Promise<U>, timeout: number) => (...args: T) => Promise<U>;

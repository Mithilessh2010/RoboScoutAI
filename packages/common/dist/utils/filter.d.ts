export declare function notEmpty<TValue>(value: TValue | null | undefined): value is TValue;
export declare function groupBy<T, K extends string | number>(arr: T[], f: (_: T) => K): Record<K, T[]>;
export declare function groupBySingle<T, K extends string | number>(arr: T[], f: (_: T) => K): Record<K, T>;

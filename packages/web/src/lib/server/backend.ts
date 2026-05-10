import "reflect-metadata";
import { loadServerEnv } from "$lib/server/env";

let initPromise: Promise<void> | null = null;
let dataSource: any = null;

export async function getDataSource(): Promise<any> {
    if (dataSource) return dataSource;

    loadServerEnv();
    const dataSourceModule = await import("@ftc-scout/server/dist/db/data-source.js");
    dataSource = dataSourceModule.DATA_SOURCE;
    return dataSource;
}

export async function ensureBackendReady(): Promise<void> {
    loadServerEnv();
    const source = await getDataSource();
    if (source.isInitialized) return;

    initPromise ??= source.initialize().then(async () => {
        const dynModule = await import("@ftc-scout/server/dist/db/entities/dyn/init.js");
        dynModule.initDynamicEntities();
    });

    await initPromise;
}

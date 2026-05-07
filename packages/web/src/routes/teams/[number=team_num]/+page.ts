import { browser } from "$app/environment";
import { get } from "svelte/store";
import { getClient } from "$lib/graphql/client";
import { TeamDocument } from "$lib/graphql/generated/graphql-operations";
import { getData } from "$lib/graphql/getData";
import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { seasonFromUrl } from "./+page.svelte";
import { refreshLiveStats } from "$lib/live-refresh";

export const load: PageLoad = async ({ url, params, fetch }) => {
    let season = seasonFromUrl(url);
    let didRefresh = await refreshLiveStats(fetch, { season });

    let teamData = await getData(getClient(fetch), TeamDocument, {
        number: +params.number,
        season,
    }, undefined, didRefresh);

    if (!browser && !get(teamData)?.data?.teamByNumber)
        throw error(404, `No team with number ${params.number}`);

    return {
        team: teamData,
    };
};

import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
    return {
        season: +params.season,
        eventCode: params.code.toUpperCase(),
    };
};

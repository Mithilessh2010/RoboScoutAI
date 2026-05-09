import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params, url }) => {
    return {
        roomId: params.roomId,
        inviteState: url.searchParams.get("state"),
    };
};

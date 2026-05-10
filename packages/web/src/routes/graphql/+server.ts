import type { RequestHandler } from "./$types";
import { graphql, type GraphQLArgs } from "graphql";
import { ensureBackendReady } from "$lib/server/backend";

type GraphQLHttpBody = {
    query?: string | undefined;
    operationName?: string | undefined;
    variables?: Record<string, unknown> | string | null;
    extensions?: unknown;
};

function json(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "content-type": "application/json" },
    });
}

function parseVariables(value: GraphQLHttpBody["variables"]): Record<string, unknown> | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return JSON.parse(value) as Record<string, unknown>;
    return value;
}

async function executeGraphQL(body: GraphQLHttpBody): Promise<Response> {
    if (!body.query) {
        return json({
            errors: [{ message: "PersistedQueryNotFound" }],
        });
    }

    await ensureBackendReady();
    const schemaModule = await import("@ftc-scout/server/dist/graphql/schema.js");

    const args: GraphQLArgs = {
        schema: schemaModule.GQL_SCHEMA,
        source: body.query,
        variableValues: parseVariables(body.variables),
        operationName: body.operationName,
    };

    return json(await graphql(args));
}

export const GET: RequestHandler = async ({ url }) => {
    try {
        return executeGraphQL({
            query: url.searchParams.get("query") ?? undefined,
            operationName: url.searchParams.get("operationName") ?? undefined,
            variables: url.searchParams.get("variables"),
            extensions: url.searchParams.get("extensions"),
        });
    } catch {
        return json({ errors: [{ message: "Invalid GraphQL request." }] }, 400);
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        return executeGraphQL((await request.json()) as GraphQLHttpBody);
    } catch {
        return json({ errors: [{ message: "Invalid GraphQL request." }] }, 400);
    }
};

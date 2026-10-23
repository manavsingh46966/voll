import request from "supertest";
import { app } from "../../app.ts";
import { type SeededUser, tokenFor } from "./users.ts";

export interface ApiOptions {
    /** A seeded user (a token is minted for them) or a raw bearer token. */
    as?: SeededUser | string;
    /**
     * Client IP sent as X-Forwarded-For. Defaults to a fresh address per request so the
     * in-memory rate limiter never throttles unrelated tests. This relies on X2 (the limiter
     * trusts X-Forwarded-For); VOL-003 must replace it with a limiter reset when that is fixed.
     */
    ip?: string;
}

export interface ApiClient {
    get: (path: string) => request.Test;
    post: (path: string, body?: object) => request.Test;
    put: (path: string, body?: object) => request.Test;
    patch: (path: string, body?: object) => request.Test;
    delete: (path: string) => request.Test;
}

let ipSequence = 0;

function nextClientIp(): string {
    ipSequence += 1;
    return `10.0.${String(Math.floor(ipSequence / 256) % 256)}.${String(ipSequence % 256)}`;
}

/** Drives the Express app in-process. Paths are relative to `/api`, like the frontend's apiClient. */
export function api(options: ApiOptions = {}): ApiClient {
    const agent = request(app);
    const token = typeof options.as === "string" || options.as === undefined
        ? options.as
        : tokenFor(options.as);

    const prepare = (test: request.Test): request.Test => {
        const withIp = test.set("X-Forwarded-For", options.ip ?? nextClientIp());
        return token === undefined ? withIp : withIp.set("Authorization", `Bearer ${token}`);
    };

    return {
        get: (path) => prepare(agent.get(`/api${path}`)),
        post: (path, body = {}) => prepare(agent.post(`/api${path}`)).send(body),
        put: (path, body = {}) => prepare(agent.put(`/api${path}`)).send(body),
        patch: (path, body = {}) => prepare(agent.patch(`/api${path}`)).send(body),
        delete: (path) => prepare(agent.delete(`/api${path}`)),
    };
}

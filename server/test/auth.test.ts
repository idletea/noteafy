import { expect, test } from "bun:test";
import { sign, verify } from "hono/jwt";
import { app } from "../lib/app";
import { ADMIN_TOKEN, JWT_COOKIE_NAME, JWT_SECRET } from "../lib/env";

const HOST = "http://localhost:3000";
const VALID_JWT = await sign({ valid: true }, JWT_SECRET);
const INVALID_JWT = VALID_JWT + "more";

test("allow unauthed index", async () => {
    const req = new Request(`${HOST}/`);
    const res = await app.request(req);
    expect([404, 200].includes(res.status)).toBeTruthy();
});

test("allow valid jwt auth", async () => {
    const req = new Request(`${HOST}/api/v1`, {
        headers: { "Cookie": `${JWT_COOKIE_NAME}=${VALID_JWT}` },
    });
    const res = await app.request(req);
    expect([404, 200].includes(res.status)).toBeTruthy();
});

test("allow valid token auth", async () => {
    const req = new Request(`${HOST}/api/v1`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const res = await app.request(req);
    expect([404, 200].includes(res.status)).toBeTruthy();
});

test("bounce unauthed", async () => {
    const req = new Request(`${HOST}/api/v1`);
    const res = await app.request(req);
    expect(res.status).toEqual(401);
});

test("bounce invalid bearer auth", async () => {
    const req = new Request(`${HOST}/api/v1`, {
        headers: { Authorization: "Bearer definitely-not-right" },
    });
    const res = await app.request(req);
    expect(res.status).toEqual(403);
});

test("bounce invalid jwt auth", async () => {
    const req = new Request(`${HOST}/api/v1`, {
        headers: { "Cookie": `${JWT_COOKIE_NAME}=${INVALID_JWT}` },
    });
    const res = await app.request(req);
    expect(res.status).toEqual(403);
});

test("bounce auth for bad token bearer", async () => {
    const req = new Request(`${HOST}/auth`, {
        method: "POST",
        headers: { Authorization: "Bearer definitely-not-right" },
    });
    const res = await app.request(req);
    expect(res.headers.get("Set-Cookie")).toBeNull();
    expect(res.status).toEqual(403);
});

test("issue jwt for token bearer", async () => {
    const req = new Request(`${HOST}/auth`, {
        method: "POST",
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const res = await app.request(req);
    const cookie = res.headers.get("Set-Cookie");
    expect(cookie).toBeTruthy();
    const jwt = (<string>cookie).split("=")[1].split(";")[0];
    expect(jwt).toBeTruthy();
    expect(await verify(<string>jwt, JWT_SECRET)).toBeTruthy();
});

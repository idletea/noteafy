import { Hono } from "hono";
import { logger } from "hono/logger";
import * as auth from "./auth";

export const app = new Hono();
app.use("*", logger());

app.get("/", (ctx) => ctx.json({ success: true }));

app.mount("/auth", auth.app.fetch);

app.use("/api/*", auth.middleware);
// app.get("/api/v1", (ctx) => {
//     return ctx.json({ success: true });
// });

import { BIND, DEV, PORT } from "./lib/env";
import { app } from "./lib/app";

if (DEV) { console.log(`=> debug enabled`) };
console.log(`=> listening on http://${BIND}:${PORT}...`);
Bun.serve({
    fetch: app.fetch,
    development: DEV,
    hostname: BIND,
    port: PORT,
});

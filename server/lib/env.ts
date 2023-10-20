export const DEV = optional_env("NOTEAFY_DEV") !== null;
export const PORT = parseInt(optional_env("NOTEAFY_PORT") || "3000");
export const BIND = optional_env("NOTEAFY_BIND") || "localhost";

export const ADMIN_TOKEN = DEV ? "hunter2" : require_env("NOTEAFY_ADMIN_TOKEN");
export const JWT_SECRET = DEV ? "dev-secret-key" : require_env("NOTEAFY_JWT_SECRET");
export const JWT_VALID_MINS = parseInt(optional_env("NOTEAFY_JWT_VALID_MINS") || "120");
export const JWT_COOKIE_NAME = optional_env("NOTEAFY_JWT_COOKIE_NAME") || "noteafy-jwt";

function optional_env(key: string): string | null {
    try {
        return require_env(key);
    } catch (_err) {
        return null;
    }
}

function require_env(key: string): string {
    const val = Bun.env[key];
    if (val === undefined || val === "") {
        throw new Error(`missing required env var ${key}`);
    } else {
        return val;
    }
}

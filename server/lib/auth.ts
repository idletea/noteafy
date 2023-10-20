import { Hono, Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { ADMIN_TOKEN, JWT_COOKIE_NAME, JWT_SECRET, JWT_VALID_MINS } from "./env";

export const app = new Hono();
app.post("/", middleware, async (ctx) => {
    const jwt = await create_jwt(["admin"]);

    setCookie(ctx, JWT_COOKIE_NAME, jwt, {
        maxAge: JWT_VALID_MINS * 60,
        sameSite: "Strict",
        secure: true,
    });

    return ctx.json({
        success: true,
        message: "jwt issued",
    });
});

// verify the request has the admin token or else a valid jwt
export async function middleware(ctx: Context, next: () => Promise<void>) {
    if (check_bearer_auth(ctx)) {
        ctx.set("authentication", "token");
    } else {
        const jwt = await verify_jwt(ctx);
        if (jwt.token === undefined) {
            throw_bad_auth(401, "no authentication provided");
        } else if (jwt.error !== undefined) {
            throw_bad_auth(403, jwt.error.message);
        } else {
            ctx.set("authentication", "jwt");
        }
    }
    await next();
}

function check_bearer_auth(ctx: Context): boolean {
    const bearer = bearer_auth(ctx);
    if (bearer === ADMIN_TOKEN) {
        return true;
    } else if (bearer !== undefined) {
        throw_bad_auth(403, "unrecognized bearer token");
    }
    return false;
}

function throw_bad_auth(status: number, message: string) {
    throw new HTTPException(0, {
        res: Response.json({
            success: false,
            message: message,
        }, status),
    });
}

function bearer_auth(ctx: Context): string | undefined {
    const hdr = ctx.req.header("Authorization") || "";
    return hdr.match(/Bearer\s+(?<t>.*)/)?.groups?.t;
}

async function verify_jwt(ctx: Context): Promise<({
    token: string | undefined, error: Error | undefined, payload: object | undefined
})> {
    const cookie = getCookie(ctx, JWT_COOKIE_NAME);
    if (cookie === undefined) {
        return { token: undefined, error: undefined, payload: undefined };
    } else {
        let err = undefined;
        let payload = undefined;
        try {
            payload = await verify(cookie, JWT_SECRET);
        } catch (error) {
            if (error instanceof Error) {
                err = error;
            }
        }

        return {
            token: cookie,
            error: err,
            payload: payload,
        }
    }
}

async function create_jwt(roles: [string]): Promise<string> {
    const clock_skew_slop = 10;

    const iat = Math.floor(Date.now() / 1000) - clock_skew_slop;
    const exp = iat + (JWT_VALID_MINS * 60) + clock_skew_slop;
    const jti = create_jti();
    const payload = { iat: iat, exp: exp, jti: jti, roles: roles };

    return await sign(payload, JWT_SECRET);
}

// Create reasonably unique nonce
function create_jti(): number {
    const BYTE_SIZE = 4;

    const rand_bytes = new Uint8Array(BYTE_SIZE);
    crypto.getRandomValues(rand_bytes);

    let jti = 0;
    for (let i = 0; i < BYTE_SIZE; i++) {
        jti |= rand_bytes[i] << (i * 8);
    }

    return jti;
}

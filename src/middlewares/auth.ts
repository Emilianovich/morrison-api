import {createMiddleware} from "hono/factory";
import type {MiddlewareVars} from "../types/middleware-vars.js";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";


const authMiddleware = createMiddleware<MiddlewareVars>(
    async (ctx, next) => {
        const sessionCookie = getCookie(ctx, "user_session")
        if (!sessionCookie) throw new HTTPException(401, { message: "No se pudo validar la sesión, vuelva a iniciar sesión" })
        ctx.set("session_cookie", sessionCookie)
        await next()
    }
)

export default authMiddleware;
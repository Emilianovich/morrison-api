import { createMiddleware } from "hono/factory";
import type {MiddlewareVars} from "../types/middleware-vars.js";

const generalMiddleware = createMiddleware<MiddlewareVars>(
    async (ctx, next) => {
        await next();
        if (ctx.res.status <= 299) {
            ctx.res = ctx.json({
                content: await ctx.res.json(),
            })
        }
    }
)
export default generalMiddleware;
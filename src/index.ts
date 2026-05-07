import { Hono } from "hono";
import { config } from "./config.ts";
import { NotestockWebhookBodySceheme } from "./type.ts";
import { checkSecretInUrl } from "./util.ts";
import { handleWebhook } from "./webhook.ts";

const app = new Hono();

app.post("/", async (c) => {
    if (!checkSecretInUrl(c.req.url, config.SECRET)) {
        console.log("secret is not correct");
        return c.body(null);
    }
    const json: unknown = await c.req.json().catch(() => null);
    const parsed = NotestockWebhookBodySceheme.safeParse(json);
    if (!parsed.success) {
        console.error(parsed.error);
        return c.text("you have bad body!", 400);
    }

    // OpenAIの応答が30秒以上かかってもwebhookが落ちないよう、
    // 即200を返してから後段の処理をwaitUntilで非同期に走らせる
    c.executionCtx.waitUntil(handleWebhook(parsed.data));
    return c.text("you have nice body!");
});

export default app;

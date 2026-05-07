import { env } from "cloudflare:workers";

const configKeys = {
    DEBUG_FORCE_REPLY: env.DEBUG_FORCE_REPLY === "true",
    SECRET: env.SECRET,
    ACTOR_JSON_URL: env.ACTOR_JSON_URL,
    LUCK_PERCENTAGE: Number(env.LUCK_PERCENTAGE),
    REACTION_ACCT_WHITELIST: env.REACTION_ACCT_WHITELIST?.split(","),
    BOT_USE_SIGNATURES: env.BOT_USE_SIGNATURES === "true",
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    MASTODON_BOT_HOST: env.MASTODON_BOT_HOST,
    MASTODON_BOT_ACCT: env.MASTODON_BOT_ACCT,
    MASTODON_BOT_TOKEN: env.MASTODON_BOT_TOKEN,
};

(Object.keys(configKeys) as (keyof typeof configKeys)[]).forEach((key) => {
    if (configKeys[key] === undefined) {
        throw new Error(`Environment variable ${key} is not set`);
    }
});

export const config = Object.freeze(configKeys) as {
    readonly [K in keyof typeof configKeys]: NonNullable<(typeof configKeys)[K]>;
};

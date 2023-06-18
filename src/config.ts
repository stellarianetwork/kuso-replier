import "https://deno.land/std@0.188.0/dotenv/load.ts";

const configKeys = {
    DEBUG_FORCE_REPLY: Deno.env.get("DEBUG_FORCE_REPLY") === "true",
    SECRET: Deno.env.get("SECRET"),
    ACTOR_JSON_URL: Deno.env.get("ACTOR_JSON_URL"),
    LUCK_PERCENTAGE: Number(Deno.env.get("LUCK_PERCENTAGE")),
    REACTION_ACCT_WHITELIST: Deno.env
        .get("REACTION_ACCT_WHITELIST")
        ?.split(","),
    BOT_USE_SIGNATURES: Deno.env.get("BOT_USE_SIGNATURES") === "true",
    OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY"),
    MASTODON_BOT_HOST: Deno.env.get("MASTODON_BOT_HOST"),
    MASTODON_BOT_ACCT: Deno.env.get("MASTODON_BOT_ACCT"),
    MASTODON_BOT_TOKEN: Deno.env.get("MASTODON_BOT_TOKEN"),
};

(Object.keys(configKeys) as (keyof typeof configKeys)[]).forEach((key) => {
    if (configKeys[key] === undefined) {
        throw new Error(`Environment variable ${key} is not set`);
    }
});

export const config = Object.freeze(configKeys) as {
    readonly [K in keyof typeof configKeys]: NonNullable<
        (typeof configKeys)[K]
    >;
};

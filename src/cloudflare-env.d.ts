declare namespace Cloudflare {
    // 全てのキーは config.ts の起動時バリデーションで NonNullable に narrow される。
    // 型上は dashboard / .dev.vars 未登録のケースを表現するため optional にしておく
    interface Env {
        DEBUG_FORCE_REPLY?: string;
        SECRET?: string;
        ACTOR_JSON_URL?: string;
        LUCK_PERCENTAGE?: string;
        REACTION_ACCT_WHITELIST?: string;
        BOT_USE_SIGNATURES?: string;
        OPENAI_API_KEY?: string;
        MASTODON_BOT_HOST?: string;
        MASTODON_BOT_ACCT?: string;
        MASTODON_BOT_TOKEN?: string;
    }
}

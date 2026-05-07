import { createRestAPIClient } from "masto";
import { config } from "../config.ts";

export function createClient() {
    return createRestAPIClient({
        url: config.MASTODON_BOT_HOST,
        accessToken: config.MASTODON_BOT_TOKEN,
    });
}

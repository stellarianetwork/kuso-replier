import { mastodon } from "masto";
import { config } from "../config.ts";
import { addSignatureToText, splitMessage } from "../util.ts";
import type { mastodon as mastodonTypes } from "masto";

// 投稿がbotによるものかを判定する
export function postIsByBot(post: mastodon.v1.Status) {
    return post.account.acct === config.MASTODON_BOT_ACCT;
}

export function getPosterType(post: mastodon.v1.Status): "assistant" | "user" {
    return postIsByBot(post) ? "assistant" : "user";
}

export function createPostTextFromCompletion(
    signature: string,
    toAcct: string,
    completion: string
) {
    if (config.BOT_USE_SIGNATURES) {
        return addSignatureToText(signature, `@${toAcct} ${completion}`);
    }
    return `@${toAcct} ${completion}`;
}

// Mastodonの文字数制限は500文字
const MASTODON_MAX_LENGTH = 500;

export async function postAsThread(
    client: mastodonTypes.rest.Client,
    status: string,
    inReplyToId: string,
    visibility: mastodon.v1.StatusVisibility = "unlisted"
) {
    const messages = splitMessage(status, MASTODON_MAX_LENGTH);
    let currentReplyId = inReplyToId;

    for (const message of messages) {
        const result = await client.v1.statuses.create({
            status: message,
            inReplyToId: currentReplyId,
            visibility,
        });
        currentReplyId = result.id;
    }
}

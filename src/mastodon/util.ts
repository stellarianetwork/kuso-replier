import { mastodon } from "masto";
import { config } from "../config.ts";
import { addSignatureToText } from "../util.ts";

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
    return addSignatureToText(signature, `@${toAcct} ${completion}`);
}

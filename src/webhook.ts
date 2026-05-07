import { getRandomActor } from "./actor.ts";
import { config } from "./config.ts";
import { createClient } from "./mastodon/api.ts";
import { createPostTextFromCompletion, getPosterType, postAsThread } from "./mastodon/util.ts";
import { getAcctFromAttributedTo, getPostIdFromUrl } from "./notestock/util.ts";
import { generateChatCompletion } from "./openai/api.ts";
import type { NotestockWebhookBody } from "./type.ts";
import { removeMentionFromText, removeSignatureFromText, stripHtml } from "./util.ts";

export async function handleWebhook(post: NotestockWebhookBody): Promise<void> {
    const postContent = stripHtml(post.content);

    console.log("received: ", post.id, postContent);

    const botClient = createClient();

    const postIsReply = !!post.tag.find((tag) => tag.type === "Mention");
    if (postIsReply) {
        const postIsReplyToBot = post.tag.find(
            (tag) => tag.type === "Mention" && tag.name === "@" + config.MASTODON_BOT_ACCT,
        );
        if (!postIsReplyToBot) {
            console.log("post is reply, but not to bot");
            return;
        }
        console.log("post is reply to bot");
    }

    const postByAllowedUser = config.REACTION_ACCT_WHITELIST.includes(
        getAcctFromAttributedTo(post.attributedTo),
    );
    if (!postByAllowedUser) {
        console.log("post is not by allowed user");
        return;
    }

    // この時点で、投稿はbotへのリプライか、リプライではない投稿

    if (postIsReply) {
        // リプライなら必ず返信する

        const context = await botClient.v1.statuses
            .$select(getPostIdFromUrl(post.url))
            .context.fetch();

        const { actor, completion } = await (async () => {
            const firstAncestor = context.ancestors[0];
            if (!firstAncestor) {
                // コンテキストがないのでいまの投稿を最初のものとして扱う
                const actor = await getRandomActor(stripHtml(post.content));
                const completion = await generateChatCompletion({
                    posts: [
                        {
                            text: stripHtml(post.content),
                            by: "user",
                        },
                    ],
                    actor,
                });
                return { actor, completion };
            }

            // actorを決めるための初期投稿を取得する
            const actor = await getRandomActor(stripHtml(firstAncestor.content));
            const completion = await generateChatCompletion({
                posts: [
                    ...context.ancestors.map((ancestor) => ({
                        // removeSignatureFromTextは、BOT_USE_SIGNATURES設定によらず呼び出す
                        text: removeSignatureFromText(actor.signature, stripHtml(ancestor.content)),
                        by: getPosterType(ancestor),
                    })),
                    {
                        text: postContent,
                        by: "user" as const,
                    },
                ],
                actor,
            });
            return { actor, completion };
        })();

        if (!completion) {
            console.error("completion is empty");
            return;
        }

        await postAsThread(
            botClient,
            createPostTextFromCompletion(
                actor.signature,
                getAcctFromAttributedTo(post.attributedTo),
                removeMentionFromText(completion),
            ),
            getPostIdFromUrl(post.url),
            "unlisted",
        );
        return;
    }

    // 単一の投稿

    // リンクが含まれていたらやめる
    if (postContent.includes("http")) {
        console.log("don't bother now. (post has link)");
        return;
    }

    // 引用で始まっていたらやめる
    if (postContent.startsWith(">")) {
        console.log("don't bother now. (post has quote)");
        return;
    }

    // 文字がないならやめる
    if (postContent.length === 0) {
        console.log("don't bother now. (post is empty)");
        return;
    }

    // 画像が含まれていたらやめる
    if (post.attachment.length > 0) {
        console.log("don't bother now. (post has image)");
        return;
    }

    // ランダムにやめる
    const rand = Math.random();
    if (rand < config.LUCK_PERCENTAGE && !config.DEBUG_FORCE_REPLY) {
        console.log("don't bother now. (no luck)");
        return;
    }

    const actor = await getRandomActor(postContent);
    const completion = await generateChatCompletion({
        posts: [
            {
                text: postContent,
                by: "user",
            },
        ],
        actor,
    });

    if (!completion) {
        console.error("completion is empty");
        return;
    }

    await postAsThread(
        botClient,
        createPostTextFromCompletion(
            actor.signature,
            getAcctFromAttributedTo(post.attributedTo),
            removeMentionFromText(completion),
        ),
        getPostIdFromUrl(post.url),
        "unlisted",
    );
}

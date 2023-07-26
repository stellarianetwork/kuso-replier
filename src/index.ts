import { serve } from "std/http/server.ts";
import { NotestockWebhookBodySceheme } from "./type.ts";
import { createClient } from "./mastodon/api.ts";
import { config } from "./config.ts";
import { generateChatCompletion } from "./openai/api.ts";
import {
    checkSecretInUrl,
    getRandomActor,
    removeMentionFromText,
    removeSignatureFromText,
    stripHtml,
} from "./util.ts";
import {
    createPostTextFromCompletion,
    getPosterType,
} from "./mastodon/util.ts";
import { getAcctFromAttributedTo, getPostIdFromUrl } from "./notestock/util.ts";

serve(async (req: Request): Promise<Response> => {
    if (!req.body) {
        return new Response(null, { status: 404 });
    }

    if (!checkSecretInUrl(req.url)) {
        console.log("secret is not correct");
        return new Response(null);
    }

    const body = new TextDecoder().decode(
        (await req.body?.getReader().read()).value
    );

    const nsBody = NotestockWebhookBodySceheme.safeParse(JSON.parse(body));
    if (!nsBody.success) {
        console.error(nsBody.error);
        return new Response("you have bad body!", { status: 400 });
    }
    const post = nsBody.data;
    const postContent = stripHtml(post.content);

    console.log("received: ", post.id, postContent);

    const botClient = await createClient();

    const postIsReply = !!post.tag.find((tag) => tag.type === "Mention");
    if (postIsReply) {
        const postIsReplyToBot = post.tag.find(
            (tag) => tag.type === "Mention" && tag.name === "@" + config.MASTODON_BOT_ACCT
        );
        if (!postIsReplyToBot) {
            console.log("post is reply, but not to bot");
            return new Response(null);
        }
        console.log("post is reply to bot");
    }

    const postByAllowedUser = config.REACTION_ACCT_WHITELIST?.includes(
        getAcctFromAttributedTo(post.attributedTo)
    );
    if (!postByAllowedUser) {
        console.log("post is not by allowed user");
        return new Response(null);
    }

    // この時点で、投稿はbotへのリプライか、リプライではない投稿

    // ランダムにリプライする
    if (postIsReply) {
        // リプライなら必ず返信する

        const context = await botClient.v1.statuses.fetchContext(
            getPostIdFromUrl(post.url)
        );

        const { actor, completion } = await (async () => {
            if (context.ancestors.length === 0) {
                // コンテキストがないのでいまの投稿を最初のものとして扱う
                const actor = getRandomActor(stripHtml(post.content));
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

            } else {
                // actorを決めるための初期投稿を取得する
                const actor = getRandomActor(stripHtml(context.ancestors[0].content));
                const completion = await generateChatCompletion({
                    posts: [
                        ...context.ancestors.map((post) => ({
                            // removeSignatureFromTextは、BOT_USE_SIGNATURES設定によらず呼び出す
                            text: removeSignatureFromText(
                                actor.signature,
                                stripHtml(post.content)
                            ),
                            by: getPosterType(post),
                        })),
                        {
                            text: postContent,
                            by: "user",
                        },
                    ],
                    actor,
                });
                return { actor, completion };
            }
        })()

        if (!completion) {
            console.error("completion is empty");
            return new Response(null);
        }

        await botClient.v1.statuses.create({
            status: createPostTextFromCompletion(
                actor.signature,
                getAcctFromAttributedTo(post.attributedTo),
                removeMentionFromText(completion)
            ),
            inReplyToId: getPostIdFromUrl(post.url),
            visibility: "unlisted",
        });
    } else {
        // 単一の投稿

        // リンクが含まれていたらやめる
        if (postContent.includes("http")) {
            console.log("don't bother now. (post has link)");
            return new Response(null);
        }

        // 引用で始まっていたらやめる
        if (postContent.startsWith(">")) {
            console.log("don't bother now. (post has quote)");
            return new Response(null);
        }

        // 文字がないならやめる
        if (postContent.length === 0) {
            console.log("don't bother now. (post is empty)");
            return new Response(null);
        }

        // 画像が含まれていたらやめる
        if (post.attachment.length > 0) {
            console.log("don't bother now. (post has image)");
            return new Response(null);
        }

        // ランダムにやめる
        const rand = Math.random();
        // 確率でやめる、ただしデバッグモードなら必ずパスする
        if (rand < config.LUCK_PERCENTAGE && !config.DEBUG_FORCE_REPLY) {
            console.log("don't bother now. (no luck)");
            return new Response(null);
        }

        const actor = getRandomActor(postContent);
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
            return new Response(null);
        }

        await botClient.v1.statuses.create({
            status: createPostTextFromCompletion(
                actor.signature,
                getAcctFromAttributedTo(post.attributedTo),
                removeMentionFromText(completion)
            ),
            inReplyToId: getPostIdFromUrl(post.url),
            visibility: "unlisted",
        });
    }

    return new Response("you have nice body!");
});

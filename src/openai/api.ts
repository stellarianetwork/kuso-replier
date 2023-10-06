import { ChatCompletion, OpenAI, ChatCompletionOptions } from "openai";
import { config } from "../config.ts";
import { Actor } from "../util.ts";

type Post = {
    text: string;
    by: "user" | "assistant";
};

export async function generateChatCompletion({
    posts,
    actor,
}: {
    posts: Post[];
    actor: Actor;
}) {
    async function fetchRetry(tryCount: number): Promise<ChatCompletion> {
        try {
            console.log(`Remaining attempts: ${tryCount}`);
            const res = await createChatCompletionWithTimeout({
                posts,
                actor,
            });
            if ("error" in res) throw new Error("OpenAI API Error");
            return res;
        } catch (err) {
            if (tryCount === 1) throw err;
            return await fetchRetry(tryCount - 1);
        }
    }
    const chatCompletion = await fetchRetry(3);

    console.log(JSON.stringify(chatCompletion, null, 2));
    return chatCompletion.choices.at(0)?.message.content;
}

function createChatCompletionWithTimeout({
    posts,
    actor,
    timeoutSeconds = 60 * 5,
}: {
    posts: Post[];
    actor: Actor;
    timeoutSeconds?: number;
}): Promise<ChatCompletion> {
    const openAI = new OpenAI(config.OPENAI_API_KEY);
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.warn("Timeout");
            reject(new Error("Timeout"));
        }, timeoutSeconds * 1000);

        const messages: ChatCompletionOptions["messages"] = [
            {
                role: "system",
                content: actor.descriptionToCompletion,
            },
            ...posts.map((post) => ({
                role: post.by,
                content: post.text,
            })),
        ];

        console.log(messages);

        openAI
            .createChatCompletion({
                model: "gpt-4",
                messages,
            })
            .then((chatCompletion) => {
                clearTimeout(timeout);
                resolve(chatCompletion);
            })
            .catch((err) => {
                clearTimeout(timeout);
                reject(err);
            });
    });
}

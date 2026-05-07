import OpenAI from "openai";
import type { Actor } from "../actor.ts";
import { config } from "../config.ts";

interface Post {
    text: string;
    by: "user" | "assistant";
}

const TIMEOUT_SECONDS = 60 * 5;
const MAX_RETRY = 3;

export async function generateChatCompletion({
    posts,
    actor,
}: {
    posts: Post[];
    actor: Actor;
}): Promise<string | null | undefined> {
    async function fetchRetry(tryCount: number): Promise<string | null | undefined> {
        try {
            console.log(`Remaining attempts: ${String(tryCount)}`);
            return await createChatCompletionWithTimeout({ posts, actor });
        } catch (err) {
            if (tryCount === 1) throw err;
            return await fetchRetry(tryCount - 1);
        }
    }
    return await fetchRetry(MAX_RETRY);
}

async function createChatCompletionWithTimeout({
    posts,
    actor,
    timeoutSeconds = TIMEOUT_SECONDS,
}: {
    posts: Post[];
    actor: Actor;
    timeoutSeconds?: number;
}): Promise<string | null | undefined> {
    const openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
        timeout: timeoutSeconds * 1000,
    });

    const messages = [
        {
            role: "system" as const,
            content: actor.descriptionToCompletion,
        },
        ...posts.map((post) => ({
            role: post.by,
            content: post.text,
        })),
    ];

    console.log(messages);

    const completion = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages,
    });

    console.log(JSON.stringify(completion, null, 2));
    return completion.choices.at(0)?.message.content;
}

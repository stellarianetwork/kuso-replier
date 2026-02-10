import { stripHtml as stringStripHtml } from "string-strip-html";
import { config } from "./config.ts";
import { parse } from "std/jsonc/parse.ts";

export type Actor = {
    name: string;
    signature: string;
    descriptionToCompletion: string;
};

let actor: Actor[];

try {
    actor = parse(await Deno.readTextFile("./actor.jsonc")) as Actor[];
    console.log(`local actor.jsonc loaded.`);
} catch (e) {
    console.error(e);
    console.log("actor.jsonc not found, try downloading from env url");
    const res = await fetch(config.ACTOR_JSONC_URL);
    const jsonc = parse(await res.text()) as Actor[];
    console.log("downloaded actor.jsonc");
    console.log(jsonc);
    actor = jsonc;
}
console.log(
    `loaded ${actor.length} actor(s). ${actor
        .map((a) => a.signature)
        .join(", ")}.`
);

// ランダムなactorを変えす。seedTextが同じなら同じactorを返す。
export function getRandomActor(seedText: string) {
    const seed = seedText
        .split("")
        .reduce((acc, cur) => acc + cur.charCodeAt(0), 0);
    return actor[seed % actor.length];
}

export function addSignatureToText(signature: string, text: string) {
    return `${text} [${signature}]`;
}

export function removeSignatureFromText(signature: string, text: string) {
    return text.replace(new RegExp(` \\[${signature}\\]$`), "");
}

// 文頭に含まれているかもしれない @~~~ という形式のメンションを削除する
export function removeMentionFromText(text: string) {
    return text.replace(/^@[\w-]+\s*/gm, "");
}

export function stripHtml(html: string) {
    return stringStripHtml(html, {
        skipHtmlDecoding: true,
    }).result;
}

// validである場合trueを返す
export function checkSecretInUrl(url: string) {
    const urlObj = new URL(url);
    const secret = urlObj.searchParams.get("secret");
    if (secret === null) {
        return false;
    }
    return secret === config.SECRET;
}

function findSplitPosition(
    segments: Intl.SegmentData[],
    maxLength: number,
): number {
    let currentLength = 0;
    let lastEmptyLinePos = -1;
    let lastBreakPos = -1;
    const breakPoints = ["\n", "。", "、", " "];

    // 空行とブレークポイントの位置を探す
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (currentLength + segment.segment.length > maxLength) {
            // 空行が見つかっている場合はそこで分割
            if (lastEmptyLinePos >= 0) {
                return lastEmptyLinePos;
            }
            // ブレークポイントが見つかっている場合はそこで分割
            if (lastBreakPos >= 0) {
                return lastBreakPos;
            }
            // どちらも見つからない場合は現在の位置で分割
            return i;
        }

        // 空行のチェック
        if (
            i < segments.length - 1 &&
            segment.segment === "\n" &&
            segments[i + 1].segment === "\n"
        ) {
            lastEmptyLinePos = i + 2;
        }

        // ブレークポイントのチェック
        if (breakPoints.includes(segment.segment)) {
            lastBreakPos = i + 1;
        }

        currentLength += segment.segment.length;
    }

    return segments.length;
}

export function splitMessage(message: string, maxLength: number): string[] {
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    const messages: string[] = [];
    let remainingSegments = [...segmenter.segment(message)];

    while (remainingSegments.length > 0) {
        const splitPos = findSplitPosition(remainingSegments, maxLength);
        const currentMessage = remainingSegments.slice(0, splitPos).map((s) =>
            s.segment
        ).join("");

        if (currentMessage) {
            messages.push(currentMessage);
        }

        remainingSegments = remainingSegments.slice(splitPos);
        // 先頭の空白を削除
        while (
            remainingSegments.length > 0 &&
            remainingSegments[0].segment.trim() === ""
        ) {
            remainingSegments = remainingSegments.slice(1);
        }
    }

    return messages;
}

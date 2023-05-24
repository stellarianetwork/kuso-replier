import actor from "../actor.json" assert { type: "json" };
import { stripHtml as stringStripHtml } from "string-strip-html";
import { config } from "./config.ts";

export type Actor = (typeof actor)[number];

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

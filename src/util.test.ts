/* oxlint-disable typescript/no-floating-promises -- node:test の test() は Promise を返すが、ファイル内で順次 await する必要はない */
import { equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { addSignatureToText, removeSignatureFromText, splitMessage } from "./util.ts";

test("addSignatureToText() test", () => {
    const text = addSignatureToText("signature", "text");
    equal(text, "text [signature]");
});

test("removeSignatureFromText() test", () => {
    const text = removeSignatureFromText("signature", "text [signature]");
    equal(text, "text");
});

test("splitMessage() test - short message", () => {
    const text = "これは短いメッセージです。";
    const result = splitMessage(text, 500);
    equal(result.length, 1);
    equal(result[0], text);
});

test("splitMessage() test - long message with punctuation", () => {
    const text = "これは長いメッセージです。".repeat(50); // 650文字
    const result = splitMessage(text, 500);
    // 500文字を超えるので少なくとも2つに分割される
    ok(result.length >= 2);
    // 各メッセージが500文字以下であることを確認
    for (const msg of result) {
        ok([...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(msg)].length <= 500);
    }
    // 元のテキストが復元できることを確認
    equal(result.join(""), text);
});

test("splitMessage() test - message with newlines", () => {
    const text = "1行目\n2行目\n3行目\n".repeat(20); // 280文字
    const result = splitMessage(text, 200);
    // 200文字で分割される
    ok(result.length >= 2);
    // 各メッセージが200文字以下であることを確認
    for (const msg of result) {
        ok([...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(msg)].length <= 200);
    }
});

test("splitMessage() test - exactly at max length", () => {
    const text = "あ".repeat(500);
    const result = splitMessage(text, 500);
    equal(result.length, 1);
    equal(result[0], text);
});

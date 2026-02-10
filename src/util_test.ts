import { assertEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { addSignatureToText, removeSignatureFromText, splitMessage } from "./util.ts";

Deno.test("addSignatureToText() test", () => {
    const text = addSignatureToText("signature", "text");
    assertEquals(text, "text [signature]");
});

Deno.test("removeSignatureFromText() test", () => {
    const text = removeSignatureFromText("signature", "text [signature]");
    assertEquals(text, "text");
});

Deno.test("splitMessage() test - short message", () => {
    const text = "これは短いメッセージです。";
    const result = splitMessage(text, 500);
    assertEquals(result.length, 1);
    assertEquals(result[0], text);
});

Deno.test("splitMessage() test - long message with punctuation", () => {
    const text = "これは長いメッセージです。".repeat(50); // 650文字
    const result = splitMessage(text, 500);
    // 500文字を超えるので少なくとも2つに分割される
    assertEquals(result.length >= 2, true);
    // 各メッセージが500文字以下であることを確認
    for (const msg of result) {
        assertEquals([...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(msg)].length <= 500, true);
    }
    // 元のテキストが復元できることを確認
    assertEquals(result.join(""), text);
});

Deno.test("splitMessage() test - message with newlines", () => {
    const text = "1行目\n2行目\n3行目\n".repeat(20); // 280文字
    const result = splitMessage(text, 200);
    // 200文字で分割される
    assertEquals(result.length >= 2, true);
    // 各メッセージが200文字以下であることを確認
    for (const msg of result) {
        assertEquals([...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(msg)].length <= 200, true);
    }
});

Deno.test("splitMessage() test - exactly at max length", () => {
    const text = "あ".repeat(500);
    const result = splitMessage(text, 500);
    assertEquals(result.length, 1);
    assertEquals(result[0], text);
});

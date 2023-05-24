import { assertEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { addSignatureToText, removeSignatureFromText } from "./util.ts";

Deno.test("addSignatureToText() test", () => {
    const text = addSignatureToText("signature", "text");
    assertEquals(text, "text [signature]");
});

Deno.test("removeSignatureFromText() test", () => {
    const text = removeSignatureFromText("signature", "text [signature]");
    assertEquals(text, "text");
});

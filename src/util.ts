import { stripHtml as stringStripHtml } from "string-strip-html";

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
export function checkSecretInUrl(url: string, expected: string) {
    const urlObj = new URL(url);
    const secret = urlObj.searchParams.get("secret");
    if (secret === null) {
        return false;
    }
    return secret === expected;
}

function findSplitPosition(segments: Intl.SegmentData[], maxLength: number): number {
    let currentLength = 0;
    let lastEmptyLinePos = -1;
    let lastBreakPos = -1;
    const breakPoints = ["\n", "。", "、", " "];

    for (const [i, segment] of segments.entries()) {
        if (currentLength + 1 > maxLength) {
            if (lastEmptyLinePos >= 0) return lastEmptyLinePos;
            if (lastBreakPos >= 0) return lastBreakPos;
            return i;
        }

        const next = segments[i + 1];
        if (segment.segment === "\n" && next?.segment === "\n") {
            lastEmptyLinePos = i + 2;
        }

        if (breakPoints.includes(segment.segment)) {
            lastBreakPos = i + 1;
        }

        currentLength += 1;
    }

    return segments.length;
}

export function splitMessage(message: string, maxLength: number): string[] {
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    const messages: string[] = [];
    let remainingSegments = [...segmenter.segment(message)];

    while (remainingSegments.length > 0) {
        const splitPos = findSplitPosition(remainingSegments, maxLength);
        const currentMessage = remainingSegments
            .slice(0, splitPos)
            .map((s) => s.segment)
            .join("");

        if (currentMessage) {
            messages.push(currentMessage);
        }

        remainingSegments = remainingSegments.slice(splitPos);
        // 先頭の空白を削除
        while (remainingSegments[0]?.segment.trim() === "") {
            remainingSegments = remainingSegments.slice(1);
        }
    }

    return messages;
}

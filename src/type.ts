import { z } from "zod";

export const NotestockWebhookBodySceheme = z.object({
    id: z.string(),
    url: z.string(),
    notag: z.string(),
    content: z.string(),
    summary: z.string().nullable(),
    inReplyTo: z.string().nullable(),
    attributedTo: z.string(),
    attachment: z.any().array(),
});

export type NotestockWebhookBody = z.infer<typeof NotestockWebhookBodySceheme>;

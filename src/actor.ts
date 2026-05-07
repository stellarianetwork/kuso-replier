import { config } from "./config.ts";

export interface Actor {
    name: string;
    signature: string;
    descriptionToCompletion: string;
}

let cache: Promise<Actor[]> | null = null;

export function getActors(): Promise<Actor[]> {
    cache ??= (async () => {
        const res = await fetch(config.ACTOR_JSON_URL);
        if (!res.ok) {
            throw new Error(`Failed to fetch actor.json: ${String(res.status)}`);
        }
        const actors = (await res.json()) as Actor[];
        console.log(
            `loaded ${String(actors.length)} actor(s). ${actors.map((a) => a.signature).join(", ")}.`,
        );
        return actors;
    })().catch((err: unknown) => {
        cache = null;
        throw err;
    });
    return cache;
}

export async function getRandomActor(seedText: string): Promise<Actor> {
    const actors = await getActors();
    // 同じテキストに対して安定した seed が出れば良い用途なので、
    // grapheme cluster ではなく code point 単位の処理で十分
    // oxlint-disable-next-line typescript/no-misused-spread
    const seed = [...seedText].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const actor = actors[seed % actors.length];
    if (!actor) {
        throw new Error("actor list is empty");
    }
    return actor;
}

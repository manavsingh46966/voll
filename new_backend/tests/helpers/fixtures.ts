import mongoose from "mongoose";
import { EventModel } from "../../models/event.ts";
import { GroupModel } from "../../models/group.ts";
import { StoryModel } from "../../models/story.ts";

const HOUR_MS = 60 * 60 * 1000;

/** ISO timestamp `hours` from now (negative for the past). */
export function hoursFromNow(hours: number): string {
    return new Date(Date.now() + hours * HOUR_MS).toISOString();
}

/** Inserts an event directly. Defaults to a published event running from +24h to +26h. */
export async function insertEvent(createdBy: string, overrides: Record<string, unknown> = {}): Promise<string> {
    const event = await EventModel.create({
        title: "Beach clean-up",
        fromDateTime: hoursFromNow(24),
        toDateTime: hoursFromNow(26),
        status: "published",
        createdBy,
        ...overrides,
    });
    return event._id.toString();
}

export interface InsertedStory {
    id: string;
    slug: string;
}

let storySequence = 0;

/** Inserts a story directly. Defaults to published, with a unique title so slugs never collide. */
export async function insertStory(author: string, overrides: Record<string, unknown> = {}): Promise<InsertedStory> {
    storySequence += 1;
    const story = await StoryModel.create({
        title: `A day at the shelter ${String(storySequence)}`,
        bodyMarkdown: "We spent the whole day walking dogs and cleaning kennels.",
        status: "published",
        author,
        ...overrides,
    });
    return { id: story._id.toString(), slug: story.slug ?? "" };
}

/** Inserts a group directly. The author is its only admin. */
export async function insertGroup(author: string, members: string[] = []): Promise<string> {
    const authorId = new mongoose.Types.ObjectId(author);
    const group = await GroupModel.create({
        name: "Weekend volunteers",
        author: authorId,
        admins: [authorId],
        members: members.map((id) => new mongoose.Types.ObjectId(id)),
    });
    return group._id.toString();
}

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { StoryModel } from "../models/story.ts";
import { api } from "./helpers/api.ts";
import { expectData, expectError, expectStatus } from "./helpers/envelope.ts";
import { insertStory } from "./helpers/fixtures.ts";
import { seedUser } from "./helpers/users.ts";

const StorySchema = z.object({
    _id: z.string(),
    title: z.string(),
    slug: z.string(),
    status: z.string(),
    bodyMarkdown: z.string(),
    likeCount: z.number(),
}).loose();

const LikedStorySchema = StorySchema.extend({ isLiked: z.boolean() });

const validStory = {
    title: "Our first food drive",
    bodyMarkdown: "We packed 300 meal kits. <script>alert('x')</script>**Thank you** to everyone!",
};

async function storedStory(id: string): Promise<{ viewCount: number; readCount: number; status: string }> {
    const story = await StoryModel.findById(id).lean();
    return { viewCount: story?.viewCount ?? -1, readCount: story?.readCount ?? -1, status: story?.status ?? "" };
}

describe("create", () => {
    it("creates a draft and strips script tags from the body", async () => {
        const author = await seedUser();
        const story = expectData(await api({ as: author }).post("/stories", validStory), 201, StorySchema);

        expect(story.status).toBe("draft");
        expect(story.slug).toBe("our-first-food-drive");
        expect(story.bodyMarkdown).not.toContain("<script>");
        expect(story.bodyMarkdown).toContain("**Thank you**");
    });

    it("rejects an invalid payload with 400", async () => {
        const author = await seedUser();
        expectError(await api({ as: author }).post("/stories", { title: "Short", bodyMarkdown: "tiny" }), 400, "BAD_REQUEST");
    });

    it("requires authentication", async () => {
        expectError(await api().post("/stories", validStory), 401, "UNAUTHORIZED");
    });

    it.skip("S1: two stories with the same title can coexist (VOL-016)", async () => {
        const first = await seedUser();
        const second = await seedUser();
        const a = expectData(await api({ as: first }).post("/stories", validStory), 201, StorySchema);
        const b = expectData(await api({ as: second }).post("/stories", validStory), 201, StorySchema);
        expect(a.slug).not.toBe(b.slug);
    });
});

describe("feed and visibility", () => {
    it("shows only published stories in the public feed", async () => {
        const author = await seedUser();
        const published = await insertStory(author.id);
        await insertStory(author.id, { status: "draft" });

        const feed = expectData(await api().get("/stories"), 200, z.array(StorySchema));
        expect(feed.map((s) => s._id)).toEqual([published.id]);
    });

    it("shows an author their own drafts with authorId=me", async () => {
        const author = await seedUser();
        await insertStory(author.id, { status: "draft" });
        const mine = expectData(await api({ as: author }).get("/stories?authorId=me"), 200, z.array(StorySchema));
        expect(mine).toHaveLength(1);
    });

    it("requires sign-in for authorId=me", async () => {
        expectError(await api().get("/stories?authorId=me"), 401, "UNAUTHORIZED");
    });

    it("hides a draft from others but shows it to its author", async () => {
        const author = await seedUser();
        const draft = await insertStory(author.id, { status: "draft" });
        expectError(await api().get(`/stories/${draft.id}`), 404, "NOT_FOUND");
        expectData(await api({ as: author }).get(`/stories/${draft.id}`), 200, StorySchema);
    });

    it("finds a published story by slug", async () => {
        const author = await seedUser();
        const story = await insertStory(author.id);
        const found = expectData(await api().get(`/stories/article/${story.slug}`), 200, StorySchema);
        expect(found._id).toBe(story.id);
    });

    it("rejects a malformed id with 400", async () => {
        expectError(await api().get("/stories/not-an-id"), 400, "BAD_REQUEST");
    });
});

describe("moderation", () => {
    it("lets a superadmin publish a story", async () => {
        const author = await seedUser();
        const admin = await seedUser({ role: "superadmin" });
        const draft = await insertStory(author.id, { status: "pending_approval" });

        const story = expectData(await api({ as: admin }).put(`/stories/${draft.id}`, { status: "published" }), 200, StorySchema);
        expect(story.status).toBe("published");
    });

    it("stops an author from publishing their own story", async () => {
        const author = await seedUser();
        const draft = await insertStory(author.id, { status: "draft" });
        await api({ as: author }).put(`/stories/${draft.id}`, { status: "published" });
        expect((await storedStory(draft.id)).status).not.toBe("published");
    });

    it("forbids editing someone else's story", async () => {
        const author = await seedUser();
        const stranger = await seedUser();
        const story = await insertStory(author.id);
        expectError(await api({ as: stranger }).put(`/stories/${story.id}`, { title: "Mine now" }), 403, "FORBIDDEN");
    });

    it.skip("S2: a user with story:approve can approve a pending story (VOL-016)", async () => {
        const author = await seedUser();
        const approver = await seedUser({ permissions: ["story:approve"] });
        const pending = await insertStory(author.id, { status: "pending_approval" });

        const story = expectData(await api({ as: approver }).patch(`/stories/${pending.id}/approve`), 200, StorySchema);
        expect(story.status).toBe("published");
    });

    it.skip("S3: approvers can list stories waiting for approval (VOL-016)", async () => {
        const author = await seedUser();
        const approver = await seedUser({ permissions: ["story:approve"] });
        await insertStory(author.id, { status: "pending_approval" });

        const res = await api({ as: approver }).get("/stories/moderation?status=pending_approval");
        expect(expectData(res, 200, z.array(StorySchema))).toHaveLength(1);
    });

    it.todo("S4: decide whether an author's edit sends a published story back to pending_approval (VOL-016)");
    it.todo("S5: link stories to the event they describe (VOL-035)");
    it.todo("S6: remove the unused schemas/createStory.ts (VOL-016)");
});

describe("engagement", () => {
    it("toggles a like and keeps likeCount in step", async () => {
        const author = await seedUser();
        const reader = await seedUser();
        const story = await insertStory(author.id);

        const liked = expectData(await api({ as: reader }).post(`/stories/${story.id}/like`), 200, LikedStorySchema);
        expect(liked).toMatchObject({ isLiked: true, likeCount: 1 });
        const unliked = expectData(await api({ as: reader }).post(`/stories/${story.id}/like`), 200, LikedStorySchema);
        expect(unliked).toMatchObject({ isLiked: false, likeCount: 0 });
    });

    it("refuses to like an unpublished story", async () => {
        const author = await seedUser();
        const reader = await seedUser();
        const draft = await insertStory(author.id, { status: "draft" });
        expectError(await api({ as: reader }).post(`/stories/${draft.id}/like`), 404, "NOT_FOUND");
    });

    it("counts one view per signed-in user", async () => {
        const author = await seedUser();
        const reader = await seedUser();
        const story = await insertStory(author.id);

        expectStatus(await api({ as: reader }).post(`/stories/${story.id}/record-view`), 204);
        expectStatus(await api({ as: reader }).post(`/stories/${story.id}/record-view`), 204);
        expect((await storedStory(story.id)).viewCount).toBe(1);
    });

    it("counts reads", async () => {
        const author = await seedUser();
        const story = await insertStory(author.id);
        expectStatus(await api().post(`/stories/${story.id}/record-read`), 204);
        expect((await storedStory(story.id)).readCount).toBe(1);
    });
});

describe("delete", () => {
    it("soft-deletes a story for its author", async () => {
        const author = await seedUser();
        const story = await insertStory(author.id);
        expectStatus(await api({ as: author }).delete(`/stories/${story.id}`), 204);
        expectError(await api().get(`/stories/${story.id}`), 404, "NOT_FOUND");
        expect((await StoryModel.findById(story.id).lean())?.isDeleted).toBe(true);
    });

    it("forbids deleting someone else's story", async () => {
        const author = await seedUser();
        const stranger = await seedUser();
        const story = await insertStory(author.id);
        expectError(await api({ as: stranger }).delete(`/stories/${story.id}`), 403, "FORBIDDEN");
    });
});

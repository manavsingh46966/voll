import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CommentModel } from "../models/comment.ts";
import { StoryModel } from "../models/story.ts";
import { api } from "./helpers/api.ts";
import { expectData, expectError, expectStatus } from "./helpers/envelope.ts";
import { insertStory } from "./helpers/fixtures.ts";
import { type SeededUser, seedUser } from "./helpers/users.ts";

const CommentSchema = z.object({
    _id: z.string(),
    content: z.string(),
    parentId: z.string().nullable(),
    replyCount: z.number(),
    isLiked: z.boolean(),
}).loose();

const UpdatedCommentSchema = CommentSchema.omit({ isLiked: true });

interface Thread {
    author: SeededUser;
    commenter: SeededUser;
    storyId: string;
    commentId: string;
}

async function commentCount(storyId: string): Promise<number | undefined> {
    return (await StoryModel.findById(storyId).lean())?.commentCount;
}

async function startThread(): Promise<Thread> {
    const author = await seedUser();
    const commenter = await seedUser();
    const { id: storyId } = await insertStory(author.id);
    const res = await api({ as: commenter }).post(`/stories/${storyId}/comments`, { content: "Great work!" });
    const comment = expectData(res, 201, CommentSchema);
    return { author, commenter, storyId, commentId: comment._id };
}

describe("create and list", () => {
    it("adds a top-level comment and bumps commentCount", async () => {
        const { storyId } = await startThread();
        expect(await commentCount(storyId)).toBe(1);
    });

    it("strips HTML from comment content", async () => {
        const reader = await seedUser();
        const author = await seedUser();
        const { id: storyId } = await insertStory(author.id);
        const res = await api({ as: reader }).post(`/stories/${storyId}/comments`, { content: "<b>Nice</b><script>x()</script>" });
        expect(expectData(res, 201, CommentSchema).content).toBe("Nice");
    });

    it("rejects an empty comment with 400", async () => {
        const { commenter, storyId } = await startThread();
        expectError(await api({ as: commenter }).post(`/stories/${storyId}/comments`, { content: "" }), 400, "BAD_REQUEST");
    });

    it("requires authentication", async () => {
        const { storyId } = await startThread();
        expectError(await api().post(`/stories/${storyId}/comments`, { content: "Hi" }), 401, "UNAUTHORIZED");
    });

    it("refuses comments on an unpublished story", async () => {
        const author = await seedUser();
        const { id: storyId } = await insertStory(author.id, { status: "draft" });
        expectError(await api({ as: author }).post(`/stories/${storyId}/comments`, { content: "Hi" }), 404, "NOT_FOUND");
    });

    it("adds a reply, bumps replyCount, and lists only top-level comments on the story", async () => {
        const { author, storyId, commentId } = await startThread();
        const reply = await api({ as: author }).post(`/stories/${storyId}/comments`, { content: "Thanks!", parentId: commentId });
        expect(expectData(reply, 201, CommentSchema).parentId).toBe(commentId);

        const top = expectData(await api().get(`/stories/${storyId}/comments`), 200, z.array(CommentSchema));
        expect(top.map((c) => c._id)).toEqual([commentId]);
        expect(top[0]?.replyCount).toBe(1);

        const replies = expectData(await api().get(`/comments/${commentId}/replies`), 200, z.array(CommentSchema));
        expect(replies).toHaveLength(1);
    });

    it("refuses a reply to a reply (max depth 1)", async () => {
        const { author, storyId, commentId } = await startThread();
        const reply = expectData(
            await api({ as: author }).post(`/stories/${storyId}/comments`, { content: "Reply", parentId: commentId }),
            201,
            CommentSchema,
        );
        const nested = await api({ as: author }).post(`/stories/${storyId}/comments`, { content: "Nested", parentId: reply._id });
        expectError(nested, 400, "BAD_REQUEST");
    });
});

describe("likes", () => {
    it("toggles a like on a comment", async () => {
        const { author, commentId } = await startThread();
        const LikeSchema = z.object({ likeCount: z.number(), isLiked: z.boolean() });

        expect(expectData(await api({ as: author }).post(`/comments/${commentId}/like`), 200, LikeSchema))
            .toEqual({ likeCount: 1, isLiked: true });
        expect(expectData(await api({ as: author }).post(`/comments/${commentId}/like`), 200, LikeSchema))
            .toEqual({ likeCount: 0, isLiked: false });
    });
});

describe("edit and delete", () => {
    it("lets the commenter edit their comment", async () => {
        const { commenter, commentId } = await startThread();
        const res = await api({ as: commenter }).put(`/comments/${commentId}`, { content: "Edited" });
        expect(expectData(res, 200, UpdatedCommentSchema).content).toBe("Edited");
    });

    it("forbids editing someone else's comment", async () => {
        const { author, commentId } = await startThread();
        expectError(await api({ as: author }).put(`/comments/${commentId}`, { content: "Nope" }), 403, "FORBIDDEN");
    });

    it("forbids deleting someone else's comment", async () => {
        const { author, commentId } = await startThread();
        expectError(await api({ as: author }).delete(`/comments/${commentId}`), 403, "FORBIDDEN");
    });

    it("soft-deletes a comment with its replies and fixes the counts", async () => {
        const { author, commenter, storyId, commentId } = await startThread();
        await api({ as: author }).post(`/stories/${storyId}/comments`, { content: "Reply", parentId: commentId });
        expect(await commentCount(storyId)).toBe(2);

        expectStatus(await api({ as: commenter }).delete(`/comments/${commentId}`), 204);
        expect(await commentCount(storyId)).toBe(0);
        expect(await CommentModel.countDocuments({ storyId, isDeleted: false })).toBe(0);
        expect(expectData(await api().get(`/stories/${storyId}/comments`), 200, z.array(CommentSchema))).toHaveLength(0);
    });
});

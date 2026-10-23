import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GroupModel } from "../models/group.ts";
import { api } from "./helpers/api.ts";
import { expectData, expectError, expectStatus } from "./helpers/envelope.ts";
import { insertGroup } from "./helpers/fixtures.ts";
import { type SeededUser, seedUser } from "./helpers/users.ts";

const MemberSchema = z.object({ id: z.string() }).loose();

const GroupSchema = z.object({
    id: z.string(),
    name: z.string(),
    admins: z.array(MemberSchema),
    members: z.array(MemberSchema),
    memberCount: z.number(),
}).loose();

interface GroupSetup {
    author: SeededUser;
    member: SeededUser;
    outsider: SeededUser;
    groupId: string;
}

async function setupGroup(): Promise<GroupSetup> {
    const author = await seedUser();
    const member = await seedUser();
    const outsider = await seedUser();
    const groupId = await insertGroup(author.id, [member.id]);
    return { author, member, outsider, groupId };
}

function ids(members: z.infer<typeof MemberSchema>[]): string[] {
    return members.map((m) => m.id);
}

describe("create and list", () => {
    it("creates a group with the author as admin and the initial members", async () => {
        const author = await seedUser();
        const member = await seedUser();
        const res = await api({ as: author }).post("/groups", { name: "Park rangers", initialMembers: [member.id] });
        const group = expectData(res, 201, GroupSchema);

        expect(ids(group.admins)).toEqual([author.id]);
        expect((await GroupModel.findById(group.id).lean())?.members.map(String)).toEqual([member.id]);
    });

    it("rejects an empty name with 400", async () => {
        const author = await seedUser();
        expectError(await api({ as: author }).post("/groups", { name: "" }), 400, "BAD_REQUEST");
    });

    it("rejects an unsupported photo type with 400", async () => {
        const author = await seedUser();
        const res = await api({ as: author }).post("/groups", { name: "Pics", photoData: "AAAA", photoMimeType: "image/svg+xml" });
        expectError(res, 400, "BAD_REQUEST");
    });

    it("lists groups for their author and members but not outsiders", async () => {
        const { author, member, outsider, groupId } = await setupGroup();
        const GroupsSchema = z.array(GroupSchema);

        expect(expectData(await api({ as: author }).get("/groups"), 200, GroupsSchema).map((g) => g.id)).toEqual([groupId]);
        expect(expectData(await api({ as: member }).get("/groups"), 200, GroupsSchema).map((g) => g.id)).toEqual([groupId]);
        expect(expectData(await api({ as: outsider }).get("/groups"), 200, GroupsSchema)).toHaveLength(0);
    });
});

describe("view", () => {
    it("lets a superadmin open any group", async () => {
        const { groupId } = await setupGroup();
        const admin = await seedUser({ role: "superadmin" });
        expect(expectData(await api({ as: admin }).get(`/groups/${groupId}`), 200, GroupSchema).id).toBe(groupId);
    });

    it("blocks a non-member with 403", async () => {
        const { outsider, groupId } = await setupGroup();
        expectError(await api({ as: outsider }).get(`/groups/${groupId}`), 403, "FORBIDDEN");
    });

    it("rejects a malformed id with 400", async () => {
        const user = await seedUser();
        expectError(await api({ as: user }).get("/groups/not-an-id"), 400, "BAD_REQUEST");
    });

    it("returns 404 for a group without a photo", async () => {
        const { groupId } = await setupGroup();
        expectError(await api().get(`/groups/${groupId}/photo`), 404, "NOT_FOUND");
    });

    it.skip("G1: the author and members can open their group (VOL-017)", async () => {
        const { author, member, groupId } = await setupGroup();
        expectData(await api({ as: author }).get(`/groups/${groupId}`), 200, GroupSchema);
        expectData(await api({ as: member }).get(`/groups/${groupId}`), 200, GroupSchema);
    });

    it.skip("G4: the group photo requires authentication (VOL-017)", async () => {
        const author = await seedUser();
        const res = await api({ as: author }).post("/groups", { name: "Pics", photoData: "AAAA", photoMimeType: "image/png" });
        const group = expectData(res, 201, GroupSchema);
        expectError(await api().get(`/groups/${group.id}/photo`), 401, "UNAUTHORIZED");
    });

    it.todo("G5: store group photos outside the group document (VOL-037)");
});

describe("manage", () => {
    it("lets the author rename the group but not a plain member", async () => {
        const { author, member, groupId } = await setupGroup();
        expect(expectData(await api({ as: author }).put(`/groups/${groupId}`, { name: "Renamed" }), 200, GroupSchema).name).toBe("Renamed");
        expectError(await api({ as: member }).put(`/groups/${groupId}`, { name: "Mine" }), 403, "FORBIDDEN");
    });

    it("lets the author add and remove members", async () => {
        const { author, outsider, groupId } = await setupGroup();
        const added = expectData(await api({ as: author }).post(`/groups/${groupId}/members`, { userId: outsider.id }), 200, GroupSchema);
        expect(added.memberCount).toBe(2);

        const removed = await api({ as: author }).delete(`/groups/${groupId}/members/${outsider.id}`);
        expect(expectData(removed, 200, GroupSchema).memberCount).toBe(1);
    });

    it("forbids outsiders from adding members", async () => {
        const { outsider, groupId } = await setupGroup();
        expectError(await api({ as: outsider }).post(`/groups/${groupId}/members`, { userId: outsider.id }), 403, "FORBIDDEN");
    });

    it("never removes the group creator", async () => {
        const { author, groupId } = await setupGroup();
        expectError(await api({ as: author }).delete(`/groups/${groupId}/members/${author.id}`), 403, "FORBIDDEN");
    });

    it("lets the author promote and demote a member", async () => {
        const { author, member, groupId } = await setupGroup();
        const promoted = expectData(await api({ as: author }).post(`/groups/${groupId}/admins`, { userId: member.id }), 200, GroupSchema);
        expect(ids(promoted.admins)).toContain(member.id);

        const demoted = expectData(await api({ as: author }).delete(`/groups/${groupId}/admins/${member.id}`), 200, GroupSchema);
        expect(ids(demoted.admins)).not.toContain(member.id);
    });

    it("lets only the creator promote admins", async () => {
        const { author, member, outsider, groupId } = await setupGroup();
        await api({ as: author }).post(`/groups/${groupId}/admins`, { userId: member.id });
        await api({ as: author }).post(`/groups/${groupId}/members`, { userId: outsider.id });
        const res = await api({ as: member }).post(`/groups/${groupId}/admins`, { userId: outsider.id });
        expectError(res, 403, "FORBIDDEN");
    });

    it.skip("G3: a non-member cannot be promoted to admin (VOL-017)", async () => {
        const { author, outsider, groupId } = await setupGroup();
        const res = await api({ as: author }).post(`/groups/${groupId}/admins`, { userId: outsider.id });
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
        const stored = await GroupModel.findById(groupId).lean();
        expect(stored?.admins.map(String)).not.toContain(outsider.id);
    });

    it("soft-deletes a group for its author, and forbids outsiders", async () => {
        const { author, outsider, groupId } = await setupGroup();
        expectError(await api({ as: outsider }).delete(`/groups/${groupId}`), 403, "FORBIDDEN");
        expectStatus(await api({ as: author }).delete(`/groups/${groupId}`), 204);
        expect((await GroupModel.findById(groupId).lean())?.isDeleted).toBe(true);
    });
});

describe("available users", () => {
    it.skip("G2: lists other active users to invite (VOL-014)", async () => {
        const author = await seedUser();
        const other = await seedUser();
        const res = await api({ as: author }).get("/groups/available-users");
        expect(ids(expectData(res, 200, z.array(MemberSchema)))).toEqual([other.id]);
    });
});

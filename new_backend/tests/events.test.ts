import { describe, expect, it } from "vitest";
import { z } from "zod";
import { EventModel } from "../models/event.ts";
import { api } from "./helpers/api.ts";
import { expectData, expectError, expectStatus } from "./helpers/envelope.ts";
import { hoursFromNow, insertEvent } from "./helpers/fixtures.ts";
import { type SeededUser, seedUser } from "./helpers/users.ts";

const RefSchema = z.union([z.string(), z.object({ _id: z.string() }).loose()]);

const EventSchema = z.object({
    _id: z.string(),
    title: z.string(),
    status: z.string(),
    createdBy: RefSchema,
    numberOfVolunteers: z.number(),
}).loose();

const EventWithContextSchema = EventSchema.extend({ isJoined: z.boolean(), isPending: z.boolean() });

const JoinSchema = z.object({ status: z.enum(["joined", "pending"]), message: z.string() });

const PersonSchema = z.object({ _id: z.string() }).loose();

function minimalEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return { title: "Tree planting", fromDateTime: hoursFromNow(24), toDateTime: hoursFromNow(26), ...overrides };
}

async function volunteerCount(eventId: string): Promise<number | undefined> {
    const event = await EventModel.findById(eventId).lean();
    return event?.numberOfVolunteers;
}

function refId(ref: z.infer<typeof RefSchema>): string {
    return typeof ref === "string" ? ref : ref._id;
}

describe("create", () => {
    it("creates an event in pending_approval owned by the caller", async () => {
        const user = await seedUser();
        const event = expectData(await api({ as: user }).post("/events", minimalEvent()), 201, EventSchema);
        expect(event.status).toBe("pending_approval");
        expect(refId(event.createdBy)).toBe(user.id);
    });

    it("rejects an invalid payload with 400", async () => {
        const user = await seedUser();
        expectError(await api({ as: user }).post("/events", { title: "" }), 400, "BAD_REQUEST");
    });

    it("requires authentication", async () => {
        expectError(await api().post("/events", minimalEvent()), 401, "UNAUTHORIZED");
    });

    it.skip("E1: accepts an IANA timeZone string and stores it (VOL-010)", async () => {
        const user = await seedUser();
        const res = await api({ as: user }).post("/events", minimalEvent({ timeZone: "Asia/Kolkata" }));
        const event = expectData(res, 201, EventSchema.extend({ timeZone: z.string() }));
        expect(event.timeZone).toBe("Asia/Kolkata");
    });

    it.skip("E2: accepts slots without slotId and generates one (VOL-010)", async () => {
        const user = await seedUser();
        const res = await api({ as: user }).post("/events", minimalEvent({
            slots: [{ title: "Morning", startTime: hoursFromNow(24), endTime: hoursFromNow(25), maxParticipants: 5 }],
        }));
        const event = expectData(res, 201, EventSchema.extend({ slots: z.array(z.object({ slotId: z.string() }).loose()) }));
        expect(event.slots).toHaveLength(1);
        expect(event.slots[0]?.slotId).not.toBe("");
    });

    it.skip("E3: returns 400, not 500, when toDateTime is missing (VOL-010)", async () => {
        const user = await seedUser();
        const res = await api({ as: user }).post("/events", { title: "No end", fromDateTime: hoursFromNow(24) });
        expectError(res, 400, "BAD_REQUEST");
    });

    it.skip("E4: keeps recurrence and skillGroups instead of dropping them (VOL-010)", async () => {
        const user = await seedUser();
        const res = await api({ as: user }).post("/events", minimalEvent({
            isRecurring: true,
            recurrence: { interval: 1, unit: "week", endCondition: "never" },
            skillGroups: [{ title: "Medics", skills: ["first-aid"], maxParticipants: 2 }],
        }));
        const event = expectData(res, 201, EventSchema.extend({
            recurrence: z.object({ interval: z.number(), unit: z.string() }).loose(),
            skillGroups: z.array(z.object({ title: z.string() }).loose()),
        }));
        expect(event.recurrence).toMatchObject({ interval: 1, unit: "week" });
        expect(event.skillGroups[0]?.title).toBe("Medics");
    });
});

describe("approval", () => {
    it("keeps pending events out of the public feed", async () => {
        const organizer = await seedUser();
        await insertEvent(organizer.id, { status: "pending_approval" });
        expect(expectData(await api().get("/events"), 200, z.array(EventSchema))).toHaveLength(0);
    });

    it("forbids approval without event:approve", async () => {
        const organizer = await seedUser();
        const eventId = await insertEvent(organizer.id, { status: "pending_approval" });
        expectError(await api({ as: organizer }).patch(`/events/${eventId}/approve`), 403, "FORBIDDEN");
    });

    it("publishes when an approver approves", async () => {
        const organizer = await seedUser();
        const approver = await seedUser({ permissions: ["event:approve"] });
        const eventId = await insertEvent(organizer.id, { status: "pending_approval" });

        const event = expectData(await api({ as: approver }).patch(`/events/${eventId}/approve`), 200, EventSchema);
        expect(event.status).toBe("published");

        const feed = expectData(await api().get("/events"), 200, z.array(EventSchema));
        expect(feed.map((e) => e._id)).toEqual([eventId]);
    });

    it("returns 404 when approving an event that isn't pending", async () => {
        const organizer = await seedUser();
        const approver = await seedUser({ role: "superadmin" });
        const eventId = await insertEvent(organizer.id);
        expectError(await api({ as: approver }).patch(`/events/${eventId}/approve`), 404, "NOT_FOUND");
    });

    it("lists pending events for approvers only", async () => {
        const organizer = await seedUser();
        const approver = await seedUser({ permissions: ["event:approve"] });
        await insertEvent(organizer.id, { status: "pending_approval" });

        const pending = expectData(await api({ as: approver }).get("/events/pending-approval"), 200, z.array(EventSchema));
        expect(pending).toHaveLength(1);
        expectError(await api({ as: organizer }).get("/events/pending-approval"), 403, "FORBIDDEN");
    });

    it.skip("E5: an organizer cannot publish their own event through PUT (VOL-011)", async () => {
        const organizer = await seedUser();
        const eventId = await insertEvent(organizer.id, { status: "pending_approval" });

        const res = await api({ as: organizer }).put(`/events/${eventId}`, { status: "published" });
        expect([403, 409]).toContain(res.status);
        expect((await EventModel.findById(eventId).lean())?.status).toBe("pending_approval");
    });

    it.skip("E11: a user with event:manage:any can update and delete any event (VOL-011)", async () => {
        const organizer = await seedUser();
        const moderator = await seedUser({ permissions: ["event:manage:any"] });
        const eventId = await insertEvent(organizer.id);

        expectData(await api({ as: moderator }).put(`/events/${eventId}`, { title: "Renamed" }), 200, EventSchema);
        expectStatus(await api({ as: moderator }).delete(`/events/${eventId}`), 204);
    });
});

describe("read", () => {
    it("returns an event by id", async () => {
        const organizer = await seedUser();
        const eventId = await insertEvent(organizer.id);
        const event = expectData(await api().get(`/events/${eventId}`), 200, EventSchema);
        expect(event._id).toBe(eventId);
    });

    it("rejects a malformed id with 400 and an unknown id with 404", async () => {
        expectError(await api().get("/events/not-an-id"), 400, "BAD_REQUEST");
        expectError(await api().get("/events/0123456789abcdef01234567"), 404, "NOT_FOUND");
    });

    it("adds isJoined for a signed-in volunteer", async () => {
        const organizer = await seedUser();
        const volunteer = await seedUser();
        const eventId = await insertEvent(organizer.id);
        expectData(await api({ as: volunteer }).post(`/events/${eventId}/join`), 200, JoinSchema);

        const detail = expectData(await api({ as: volunteer }).get(`/events/${eventId}`), 200, EventWithContextSchema);
        expect(detail.isJoined).toBe(true);
        const feed = expectData(await api({ as: volunteer }).get("/events"), 200, z.array(EventWithContextSchema));
        expect(feed[0]?.isJoined).toBe(true);
    });

    it("requires a search query for search-people", async () => {
        expectError(await api().get("/events/search-people"), 400, "BAD_REQUEST");
    });

    it.skip("E10: search-people finds a user by name and treats regex input literally (VOL-014)", async () => {
        const searcher = await seedUser();
        await seedUser({ name: "Bob Builder" });

        const found = expectData(await api({ as: searcher }).get("/events/search-people?q=bob"), 200, z.array(PersonSchema));
        expect(found).toHaveLength(1);
        const literal = expectData(await api({ as: searcher }).get("/events/search-people?q=.*"), 200, z.array(PersonSchema));
        expect(literal).toHaveLength(0);
    });
});

describe("update and delete", () => {
    it("lets the organizer update their event", async () => {
        const organizer = await seedUser();
        const eventId = await insertEvent(organizer.id);
        const event = expectData(await api({ as: organizer }).put(`/events/${eventId}`, { title: "Renamed" }), 200, EventSchema);
        expect(event.title).toBe("Renamed");
    });

    it("hides other users' events from update and delete", async () => {
        const organizer = await seedUser();
        const stranger = await seedUser();
        const eventId = await insertEvent(organizer.id);
        expectError(await api({ as: stranger }).put(`/events/${eventId}`, { title: "Hijacked" }), 404, "NOT_FOUND");
        expectError(await api({ as: stranger }).delete(`/events/${eventId}`), 404, "NOT_FOUND");
    });

    it("soft-deletes an event for its organizer", async () => {
        const organizer = await seedUser();
        const eventId = await insertEvent(organizer.id);
        expectStatus(await api({ as: organizer }).delete(`/events/${eventId}`), 204);
        expectError(await api().get(`/events/${eventId}`), 404, "NOT_FOUND");
        expect((await EventModel.findById(eventId).lean())?.isDeleted).toBe(true);
    });
});

describe("join and leave", () => {
    async function publishedEvent(overrides: Record<string, unknown> = {}): Promise<{ organizer: SeededUser; eventId: string }> {
        const organizer = await seedUser();
        return { organizer, eventId: await insertEvent(organizer.id, overrides) };
    }

    it("joins an open event and counts the volunteer", async () => {
        const { eventId } = await publishedEvent();
        const volunteer = await seedUser();
        const res = expectData(await api({ as: volunteer }).post(`/events/${eventId}/join`), 200, JoinSchema);
        expect(res.status).toBe("joined");
        expect(await volunteerCount(eventId)).toBe(1);
    });

    it("rejects joining twice with 409", async () => {
        const { eventId } = await publishedEvent();
        const volunteer = await seedUser();
        await api({ as: volunteer }).post(`/events/${eventId}/join`);
        expectError(await api({ as: volunteer }).post(`/events/${eventId}/join`), 409, "CONFLICT");
    });

    it("requires authentication to join", async () => {
        const { eventId } = await publishedEvent();
        expectError(await api().post(`/events/${eventId}/join`), 401, "UNAUTHORIZED");
    });

    it("refuses to join an event that isn't published", async () => {
        const { eventId } = await publishedEvent({ status: "pending_approval" });
        const volunteer = await seedUser();
        expectError(await api({ as: volunteer }).post(`/events/${eventId}/join`), 404, "NOT_FOUND");
    });

    it("rejects a time conflict with another joined event", async () => {
        const first = await publishedEvent();
        const second = await publishedEvent({ fromDateTime: hoursFromNow(25), toDateTime: hoursFromNow(27) });
        const volunteer = await seedUser();
        expectData(await api({ as: volunteer }).post(`/events/${first.eventId}/join`), 200, JoinSchema);
        expectError(await api({ as: volunteer }).post(`/events/${second.eventId}/join`), 409, "CONFLICT");
    });

    it("leaves an event and decrements the count", async () => {
        const { eventId } = await publishedEvent();
        const volunteer = await seedUser();
        await api({ as: volunteer }).post(`/events/${eventId}/join`);
        expectStatus(await api({ as: volunteer }).post(`/events/${eventId}/leave`), 204);
        expect(await volunteerCount(eventId)).toBe(0);
    });

    it("returns 404 when leaving an event you never joined", async () => {
        const { eventId } = await publishedEvent();
        const volunteer = await seedUser();
        expectError(await api({ as: volunteer }).post(`/events/${eventId}/leave`), 404, "NOT_FOUND");
    });

    it("joins into a slot and counts it", async () => {
        const { eventId } = await publishedEvent({
            slots: [{ slotId: "morning", title: "Morning", startTime: hoursFromNow(24), endTime: hoursFromNow(25), maxParticipants: 3 }],
        });
        const volunteer = await seedUser();
        expectData(await api({ as: volunteer }).post(`/events/${eventId}/join`, { slotId: "morning" }), 200, JoinSchema);
        const event = await EventModel.findById(eventId).lean();
        expect(event?.slots[0]?.currentParticipants).toBe(1);
    });

    it.skip("E6: rejects joining a full event (VOL-012)", async () => {
        const { eventId } = await publishedEvent({ reqMaxVolunteers: 1 });
        const first = await seedUser();
        const second = await seedUser();
        expectData(await api({ as: first }).post(`/events/${eventId}/join`), 200, JoinSchema);
        expectError(await api({ as: second }).post(`/events/${eventId}/join`), 409, "CONFLICT");
        expect(await volunteerCount(eventId)).toBe(1);
    });

    it.skip("E6: rejects joining a full slot (VOL-012)", async () => {
        const { eventId } = await publishedEvent({
            slots: [{ slotId: "morning", title: "Morning", startTime: hoursFromNow(24), endTime: hoursFromNow(25), maxParticipants: 1 }],
        });
        const first = await seedUser();
        const second = await seedUser();
        expectData(await api({ as: first }).post(`/events/${eventId}/join`, { slotId: "morning" }), 200, JoinSchema);
        expectError(await api({ as: second }).post(`/events/${eventId}/join`, { slotId: "morning" }), 409, "CONFLICT");
    });

    it.skip("E7: an organizer cannot join their own event (VOL-012)", async () => {
        const { organizer, eventId } = await publishedEvent();
        expectError(await api({ as: organizer }).post(`/events/${eventId}/join`), 403, "FORBIDDEN");
    });

    it.skip("E8: rejects joining an event that has ended (VOL-012)", async () => {
        const { eventId } = await publishedEvent({ fromDateTime: hoursFromNow(-5), toDateTime: hoursFromNow(-3) });
        const volunteer = await seedUser();
        expectError(await api({ as: volunteer }).post(`/events/${eventId}/join`), 409, "CONFLICT");
    });

    it.skip("E8: rejects joining after lastDateToJoin (VOL-012)", async () => {
        const { eventId } = await publishedEvent({ lastDateToJoin: hoursFromNow(-1) });
        const volunteer = await seedUser();
        expectError(await api({ as: volunteer }).post(`/events/${eventId}/join`), 409, "CONFLICT");
    });
});

describe("join requests", () => {
    async function requestedEvent(): Promise<{ organizer: SeededUser; volunteer: SeededUser; eventId: string }> {
        const organizer = await seedUser();
        const volunteer = await seedUser();
        const eventId = await insertEvent(organizer.id, { allowJoiningRequests: true });
        const res = expectData(await api({ as: volunteer }).post(`/events/${eventId}/join`), 200, JoinSchema);
        expect(res.status).toBe("pending");
        return { organizer, volunteer, eventId };
    }

    it("lists pending requests for the organizer only", async () => {
        const { organizer, volunteer, eventId } = await requestedEvent();
        const requests = expectData(await api({ as: organizer }).get(`/events/${eventId}/requests`), 200, z.array(PersonSchema));
        expect(requests.map((r) => r._id)).toEqual([volunteer.id]);
        expectError(await api({ as: volunteer }).get(`/events/${eventId}/requests`), 403, "FORBIDDEN");
    });

    it("approves a request, which adds the participant", async () => {
        const { organizer, volunteer, eventId } = await requestedEvent();
        expectStatus(await api({ as: organizer }).post(`/events/${eventId}/requests/${volunteer.id}/approve`), 204);

        const participants = expectData(await api({ as: organizer }).get(`/events/${eventId}/participants`), 200, z.array(PersonSchema));
        expect(participants.map((p) => p._id)).toEqual([volunteer.id]);
        expect(await volunteerCount(eventId)).toBe(1);
    });

    it("rejects a request, which removes it", async () => {
        const { organizer, volunteer, eventId } = await requestedEvent();
        expectStatus(await api({ as: organizer }).post(`/events/${eventId}/requests/${volunteer.id}/reject`), 204);
        const requests = expectData(await api({ as: organizer }).get(`/events/${eventId}/requests`), 200, z.array(PersonSchema));
        expect(requests).toHaveLength(0);
    });

    it("forbids a non-organizer from approving", async () => {
        const { volunteer, eventId } = await requestedEvent();
        const res = await api({ as: volunteer }).post(`/events/${eventId}/requests/${volunteer.id}/approve`);
        expectError(res, 403, "FORBIDDEN");
    });
});

describe("interest and participants", () => {
    it.skip("E9: toggling interest saves it, returning true then false (VOL-013)", async () => {
        const organizer = await seedUser();
        const volunteer = await seedUser();
        const eventId = await insertEvent(organizer.id);
        const InterestSchema = z.object({ isInterested: z.boolean() });

        expect(expectData(await api({ as: volunteer }).post(`/events/${eventId}/interest`), 200, InterestSchema).isInterested).toBe(true);
        expect(expectData(await api({ as: volunteer }).post(`/events/${eventId}/interest`), 200, InterestSchema).isInterested).toBe(false);
    });

    it.skip("E12: anonymous callers don't get participant emails (VOL-015)", async () => {
        const organizer = await seedUser();
        const volunteer = await seedUser();
        const eventId = await insertEvent(organizer.id);
        await api({ as: volunteer }).post(`/events/${eventId}/join`);

        const res = await api().get(`/events/${eventId}/participants`);
        expect(res.status).toBe(200);
        expect(JSON.stringify(res.body)).not.toContain(volunteer.email);
    });

    it.todo("E13: transactions need a replica set; the harness runs mongod as a single-node replica set (VOL-001, info only)");
});

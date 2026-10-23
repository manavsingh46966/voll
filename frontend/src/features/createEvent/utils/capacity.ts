import type {
  CreateEventFormData,
  DerivedCapacity,
  SkillGroup,
  TimeSlot,
} from "../types/event.types";

/**
 * Calculates aggregate volunteer capacities and union of skills across an array of SkillGroups.
 *
 * @param {SkillGroup[]} groups - The skill groups to calculate capacities for.
 * @returns {DerivedCapacity} Object containing summed min/max participants and unique skills.
 */
export function deriveSkillGroupCapacity(
  groups: SkillGroup[],
): DerivedCapacity {
  const minParticipants = groups.reduce(
    (total, group) => total + group.minParticipants,
    0,
  );
  const maxParticipants = groups.reduce(
    (total, group) => total + group.maxParticipants,
    0,
  );
  const skills = [...new Set(groups.flatMap((group) => group.skills))];

  return { minParticipants, maxParticipants, skills };
}

/**
 * Derives and fills min/max participants count for a TimeSlot based on its nested SkillGroups.
 * Used to ensure slot capacities are always calculated programmatically from their constituent roles.
 *
 * @param {TimeSlot} slot - The input time slot.
 * @returns {TimeSlot} A new TimeSlot object with correct calculated minParticipants and maxParticipants.
 */
export function withDerivedSlotCapacity(slot: TimeSlot): TimeSlot {
  const derived = deriveSkillGroupCapacity(slot.skillGroups ?? []);
  return {
    ...slot,
    minParticipants: derived.minParticipants,
    maxParticipants: derived.maxParticipants,
    skillGroups: slot.skillGroups ?? [],
  };
}

/**
 * Computes overall event capacity and aggregate requirements from the wizard form input data.
 * If slots exist, aggregates capacities across all slots. Otherwise, aggregates across global skill groups.
 *
 * @param {CreateEventFormData} form - The current wizard form input state.
 * @returns {DerivedCapacity} The overall calculated capacity profile for the event.
 */
export function deriveEventCapacity(
  form: CreateEventFormData,
): DerivedCapacity {
  const slotGroups = form.slots?.flatMap((s) => s.skillGroups ?? []) ?? [];
  const allGroups = [...slotGroups, ...(form.skillGroups ?? [])];

  if (allGroups.length > 0) {
    const groupDerived = deriveSkillGroupCapacity(allGroups);
    const minP = Math.max(form.minParticipants || 0, groupDerived.minParticipants);
    const maxP = Math.max(form.maxParticipants || 0, groupDerived.maxParticipants);
    const allSkills = [
      ...new Set([...(form.skills ?? []), ...groupDerived.skills]),
    ];
    return {
      minParticipants: minP,
      maxParticipants: maxP,
      skills: allSkills,
    };
  }

  return {
    minParticipants: form.minParticipants || 0,
    maxParticipants: form.maxParticipants || 0,
    skills: form.skills ?? [],
  };
}

/**
 * Validates that all slots defined in the form contain valid SkillGroups if present.
 * If no slots exist, returns true.
 *
 * @param {CreateEventFormData} form - The current wizard form input state.
 * @returns {boolean} True if slots/skill groups configuration is valid.
 */
export function hasCompleteSlotSkillGroups(form: CreateEventFormData): boolean {
  if (!form.slots || form.slots.length === 0) return true;
  return form.slots.every((slot) => {
    const groups = slot.skillGroups ?? [];
    if (groups.length === 0) return true;
    return groups.every(
      (group) =>
        group.title.trim().length > 0 &&
        group.maxParticipants > 0 &&
        group.minParticipants <= group.maxParticipants &&
        group.skills.length > 0,
    );
  });
}

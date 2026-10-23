import { create } from "zustand";

import { clientStorage } from "@/src/lib/storage";

import {
  type CreateEventFormData,
  initialCreateEventFormData,
} from "../types/event.types";

/**
 * Key used to persist the event creation draft data in client local storage.
 */
const DRAFT_KEY = "create_event_draft";

/**
 * Represents the Zustand state structure and action methods for the Event Creation Flow.
 */
interface CreateEventState {
  /** The current wizard step index (ranges from 1 to 4). */
  step: number;
  /** The reactive form data container representing inputs from all wizard steps. */
  formData: CreateEventFormData;
  /** True when the event submission API request is currently in flight. */
  isSubmitting: boolean;
  /** Increments the wizard step counter, capping at the maximum step (4). */
  nextStep: () => void;
  /** Decrements the wizard step counter, floor-limited to the minimum step (1). */
  prevStep: () => void;
  /** Directly sets the active wizard step to the specified index. */
  setStep: (step: number) => void;
  /** Updates individual form fields in state and serializes lightweight state to client storage. */
  updateData: (fields: Partial<CreateEventFormData>) => void;
  /** Clears persisted draft data from local storage and resets state back to default values. */
  clearDraft: () => void;
  /** Modifies the active isSubmitting spinner state. */
  setIsSubmitting: (val: boolean) => void;
  /** Hydrates the form state by restoring any previously saved draft from local storage. */
  hydrate: () => void;
}

/**
 * Zustand global state hook for managing the multi-step Event Creation Wizard.
 * Features automated draft persistence, automatic state hydration, and memory-safe persistence
 * that excludes large image payloads from disk writes.
 */
export const useCreateEventStore = create<CreateEventState>((set, get) => ({
  step: 1,
  formData: initialCreateEventFormData,
  isSubmitting: false,

  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 4) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
  setStep: (step) => set({ step }),
  setIsSubmitting: (val) => set({ isSubmitting: val }),

  updateData: (fields) =>
    set((s) => {
      const updated = { ...s.formData, ...fields };

      // 🚨 PERFORMANCE FIX: Strip out the massive Base64 string before saving to local storage
      const { coverPhotoBase64, ...dataToSave } = updated;

      // Save the lightweight data (text, toggles, local URI) to disk so drafts persist
      clientStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));

      // Keep the heavy Base64 string active in standard RAM state for the final submission
      return { formData: updated };
    }),

  clearDraft: () => {
    clientStorage.removeItem(DRAFT_KEY);
    set({ formData: initialCreateEventFormData, step: 1, isSubmitting: false });
  },

  hydrate: () => {
    try {
      const raw = clientStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CreateEventFormData;
        set({ formData: { ...initialCreateEventFormData, ...parsed } });
      }
    } catch {
      clientStorage.removeItem(DRAFT_KEY);
    }
  },
}));

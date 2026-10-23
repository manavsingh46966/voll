import { create } from "zustand";

import {
  addMemberApi,
  createGroupApi,
  deleteGroupApi,
  demoteAdminApi,
  getAvailableUsersApi,
  getGroupByIdApi,
  getGroupsApi,
  promoteToAdminApi,
  removeMemberApi,
  updateGroupApi,
} from "../api/groups.api";
import type {
  AvailableUser,
  CreateGroupPayload,
  GroupDetail,
  GroupSummary,
  UpdateGroupPayload,
} from "../types/group.types";

interface CreateGroupDraft {
  name: string;
  description: string;
  photoData: string | null;
  photoMimeType: string | null;
  selectedMembers: AvailableUser[];
}

interface GroupState {
  groups: GroupSummary[];
  activeGroup: GroupDetail | null;
  availableUsers: AvailableUser[];
  availableUsersNextCursor: string | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  isLoadingUsers: boolean;
  isLoadingMoreUsers: boolean;
  isMutating: boolean;
  error: string | null;
  createDraft: CreateGroupDraft;

  fetchGroups: () => Promise<void>;
  fetchGroupById: (id: string) => Promise<void>;
  fetchAvailableUsers: (q?: string) => Promise<void>;
  fetchMoreAvailableUsers: (q?: string) => Promise<void>;

  createGroup: (payload: CreateGroupPayload) => Promise<GroupDetail | null>;
  updateGroup: (
    id: string,
    payload: UpdateGroupPayload,
  ) => Promise<GroupDetail | null>;
  deleteGroup: (id: string) => Promise<boolean>;
  addMember: (groupId: string, userId: string) => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<boolean>;
  promoteToAdmin: (groupId: string, userId: string) => Promise<boolean>;
  demoteAdmin: (groupId: string, userId: string) => Promise<boolean>;

  setCreateDraft: (partial: Partial<CreateGroupDraft>) => void;
  resetCreateDraft: () => void;
  clearActiveGroup: () => void;
}

const defaultDraft: CreateGroupDraft = {
  name: "",
  description: "",
  photoData: null,
  photoMimeType: null,
  selectedMembers: [],
};

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroup: null,
  availableUsers: [],
  availableUsersNextCursor: null,
  isLoading: false,
  isLoadingDetail: false,
  isLoadingUsers: false,
  isLoadingMoreUsers: false,
  isMutating: false,
  error: null,
  createDraft: { ...defaultDraft },

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const groups = await getGroupsApi();
      set({ groups, isLoading: false });
    } catch {
      set({ error: "Failed to load groups", isLoading: false });
    }
  },

  fetchGroupById: async (id: string) => {
    set({ isLoadingDetail: true, error: null });
    try {
      const group = await getGroupByIdApi(id);
      set({ activeGroup: group, isLoadingDetail: false });
    } catch {
      set({ error: "Failed to load group", isLoadingDetail: false });
    }
  },

  fetchAvailableUsers: async (q?: string) => {
    if (!q && get().availableUsers.length > 0) return;
    set({ isLoadingUsers: true });
    try {
      const page = await getAvailableUsersApi(
        q ? { q, limit: 30 } : { limit: 30 },
      );
      set({
        availableUsers: page.users,
        availableUsersNextCursor: page.nextCursor,
        isLoadingUsers: false,
      });
    } catch {
      set({ isLoadingUsers: false });
    }
  },

  fetchMoreAvailableUsers: async (q?: string) => {
    const cursor = get().availableUsersNextCursor;
    if (!cursor || get().isLoadingMoreUsers) return;

    set({ isLoadingMoreUsers: true });
    try {
      const page = await getAvailableUsersApi({
        ...(q ? { q } : {}),
        cursor,
        limit: 30,
      });
      set((state) => ({
        availableUsers: [...state.availableUsers, ...page.users],
        availableUsersNextCursor: page.nextCursor,
        isLoadingMoreUsers: false,
      }));
    } catch {
      set({ isLoadingMoreUsers: false });
    }
  },

  createGroup: async (payload: CreateGroupPayload) => {
    set({ isMutating: true, error: null });
    try {
      const created = await createGroupApi(payload);
      set((state) => ({
        groups: [
          {
            id: created.id,
            name: created.name,
            description: created.description,
            photoMimeType: created.photoMimeType,
            hasPhoto: created.hasPhoto,
            author: created.author,
            memberCount: created.memberCount,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
          },
          ...state.groups,
        ],
        isMutating: false,
      }));
      return created;
    } catch {
      set({ error: "Failed to create group", isMutating: false });
      return null;
    }
  },

  updateGroup: async (id: string, payload: UpdateGroupPayload) => {
    set({ isMutating: true, error: null });
    try {
      const updated = await updateGroupApi(id, payload);
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id
            ? {
                ...g,
                name: updated.name,
                description: updated.description,
                hasPhoto: updated.hasPhoto,
              }
            : g,
        ),
        activeGroup: state.activeGroup?.id === id ? updated : state.activeGroup,
        isMutating: false,
      }));
      return updated;
    } catch {
      set({ error: "Failed to update group", isMutating: false });
      return null;
    }
  },

  deleteGroup: async (id: string) => {
    set({ isMutating: true, error: null });
    try {
      await deleteGroupApi(id);
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        activeGroup: state.activeGroup?.id === id ? null : state.activeGroup,
        isMutating: false,
      }));
      return true;
    } catch {
      set({ error: "Failed to delete group", isMutating: false });
      return false;
    }
  },

  addMember: async (groupId: string, userId: string) => {
    set({ isMutating: true });
    try {
      const updated = await addMemberApi(groupId, userId);
      set((state) => ({
        activeGroup:
          state.activeGroup?.id === groupId ? updated : state.activeGroup,
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, memberCount: updated.memberCount } : g,
        ),
        isMutating: false,
      }));
      return true;
    } catch {
      set({ isMutating: false });
      return false;
    }
  },

  removeMember: async (groupId: string, userId: string) => {
    set({ isMutating: true });
    try {
      const updated = await removeMemberApi(groupId, userId);
      set((state) => ({
        activeGroup:
          state.activeGroup?.id === groupId ? updated : state.activeGroup,
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, memberCount: updated.memberCount } : g,
        ),
        isMutating: false,
      }));
      return true;
    } catch {
      set({ isMutating: false });
      return false;
    }
  },

  promoteToAdmin: async (groupId: string, userId: string) => {
    set({ isMutating: true });
    try {
      const updated = await promoteToAdminApi(groupId, userId);
      set((state) => ({
        activeGroup:
          state.activeGroup?.id === groupId ? updated : state.activeGroup,
        isMutating: false,
      }));
      return true;
    } catch {
      set({ isMutating: false });
      return false;
    }
  },

  demoteAdmin: async (groupId: string, userId: string) => {
    set({ isMutating: true });
    try {
      const updated = await demoteAdminApi(groupId, userId);
      set((state) => ({
        activeGroup:
          state.activeGroup?.id === groupId ? updated : state.activeGroup,
        isMutating: false,
      }));
      return true;
    } catch {
      set({ isMutating: false });
      return false;
    }
  },

  setCreateDraft: (partial: Partial<CreateGroupDraft>) =>
    set((state) => ({ createDraft: { ...state.createDraft, ...partial } })),

  resetCreateDraft: () => set({ createDraft: { ...defaultDraft } }),

  clearActiveGroup: () => set({ activeGroup: null }),
}));

import { apiClient, getBaseUrl } from "@/src/lib/axios";

import type {
  AvailableUsersPage,
  CreateGroupPayload,
  GroupDetail,
  GroupSummary,
  UpdateGroupPayload,
} from "../types/group.types";

const GROUPS_PATH = "/groups";

/**
 *
 */
export const getGroupsApi = async (): Promise<GroupSummary[]> => {
  const res = await apiClient.get<{ success: boolean; data: GroupSummary[] }>(
    GROUPS_PATH,
  );
  return res.data.data;
};

/**
 *
 * @param id
 */
export const getGroupByIdApi = async (id: string): Promise<GroupDetail> => {
  const res = await apiClient.get<{ success: boolean; data: GroupDetail }>(
    `${GROUPS_PATH}/${id}`,
  );
  return res.data.data;
};

/**
 *
 * @param payload
 */
export const createGroupApi = async (
  payload: CreateGroupPayload,
): Promise<GroupDetail> => {
  const res = await apiClient.post<{ success: boolean; data: GroupDetail }>(
    GROUPS_PATH,
    payload,
  );
  return res.data.data;
};

/**
 *
 * @param id
 * @param payload
 */
export const updateGroupApi = async (
  id: string,
  payload: UpdateGroupPayload,
): Promise<GroupDetail> => {
  const res = await apiClient.put<{ success: boolean; data: GroupDetail }>(
    `${GROUPS_PATH}/${id}`,
    payload,
  );
  return res.data.data;
};

/**
 *
 * @param id
 */
export const deleteGroupApi = async (id: string): Promise<void> => {
  await apiClient.delete(`${GROUPS_PATH}/${id}`);
};

/**
 *
 * @param groupId
 * @param userId
 */
export const addMemberApi = async (
  groupId: string,
  userId: string,
): Promise<GroupDetail> => {
  const res = await apiClient.post<{ success: boolean; data: GroupDetail }>(
    `${GROUPS_PATH}/${groupId}/members`,
    { userId },
  );
  return res.data.data;
};

/**
 *
 * @param groupId
 * @param userId
 */
export const removeMemberApi = async (
  groupId: string,
  userId: string,
): Promise<GroupDetail> => {
  const res = await apiClient.delete<{ success: boolean; data: GroupDetail }>(
    `${GROUPS_PATH}/${groupId}/members/${userId}`,
  );
  return res.data.data;
};

/**
 *
 * @param params
 * @param params.q
 * @param params.cursor
 * @param params.limit
 * @param params.groupId
 */
export const getAvailableUsersApi = async (params?: {
  q?: string;
  cursor?: string;
  limit?: number;
  groupId?: string;
}): Promise<AvailableUsersPage> => {
  const res = await apiClient.get<{
    success: boolean;
    data: AvailableUsersPage;
  }>(`${GROUPS_PATH}/available-users`, { params });
  return res.data.data;
};

/**
 *
 * @param groupId
 */
export const getGroupPhotoUrl = (groupId: string): string => {
  const base = getBaseUrl().replace(/\/api\/?$/, "");
  return `${base}/api/groups/${groupId}/photo`;
};

/**
 *
 * @param groupId
 * @param userId
 */
export const promoteToAdminApi = async (
  groupId: string,
  userId: string,
): Promise<GroupDetail> => {
  const res = await apiClient.post<{ success: boolean; data: GroupDetail }>(
    `${GROUPS_PATH}/${groupId}/admins`,
    { userId },
  );
  return res.data.data;
};

/**
 *
 * @param groupId
 * @param userId
 */
export const demoteAdminApi = async (
  groupId: string,
  userId: string,
): Promise<GroupDetail> => {
  const res = await apiClient.delete<{ success: boolean; data: GroupDetail }>(
    `${GROUPS_PATH}/${groupId}/admins/${userId}`,
  );
  return res.data.data;
};

import { apiClient } from "@/src/lib/axios";
import type {
  NotificationFilter,
  NotificationsResponse,
} from "../types/notification.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Fetches notifications for current authenticated user.
 */
export const getNotificationsApi = async (
  filter?: NotificationFilter,
  cursor?: string,
): Promise<NotificationsResponse> => {
  const params: Record<string, string> = {};
  if (filter && filter !== "all") params.filter = filter;
  if (cursor) params.cursor = cursor;

  const res = await apiClient.get<ApiResponse<NotificationsResponse>>(
    "/notifications",
    { params },
  );
  return res.data.data;
};

/**
 * Marks a single notification as read.
 */
export const markNotificationAsReadApi = async (
  id: string,
): Promise<{ success: boolean }> => {
  const res = await apiClient.patch<ApiResponse<{ success: boolean }>>(
    `/notifications/${id}/read`,
  );
  return res.data.data;
};

/**
 * Marks all notifications for current user as read.
 */
export const markAllNotificationsAsReadApi = async (): Promise<{
  modifiedCount: number;
}> => {
  const res = await apiClient.patch<ApiResponse<{ modifiedCount: number }>>(
    "/notifications/read-all",
  );
  return res.data.data;
};

/**
 * Deletes a notification by ID.
 */
export const deleteNotificationApi = async (id: string): Promise<void> => {
  await apiClient.delete(`/notifications/${id}`);
};

/**
 * Sends an announcement from an event organizer to all joined attendees.
 */
export const broadcastAnnouncementApi = async (
  eventId: string,
  title: string,
  message: string,
): Promise<{ notifiedCount: number }> => {
  const res = await apiClient.post<ApiResponse<{ notifiedCount: number }>>(
    `/notifications/events/${eventId}/announcements`,
    { title, message },
  );
  return res.data.data;
};

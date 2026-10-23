import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  broadcastAnnouncementApi,
  deleteNotificationApi,
  getNotificationsApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "../api/notifications.api";
import type {
  NotificationFilter,
  NotificationsResponse,
} from "../types/notification.types";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (filter: NotificationFilter = "all") =>
    ["notifications", "list", filter] as const,
  unreadCount: ["notifications", "unreadCount"] as const,
};

/**
 * Hook to fetch paginated notifications with filtering.
 */
export const useNotifications = (filter: NotificationFilter = "all") => {
  return useInfiniteQuery<NotificationsResponse>({
    queryKey: notificationKeys.list(filter),
    queryFn: ({ pageParam }) =>
      getNotificationsApi(filter, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 45, // Background poll every 45s for fresh notifications
  });
};

/**
 * Hook for fetching unread notification count.
 */
export const useUnreadNotificationCount = () => {
  const { data } = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => getNotificationsApi("unread"),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 45,
  });

  return data?.unreadCount ?? 0;
};

/**
 * Hook to mark a single notification as read.
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsReadApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Hook to mark all notifications as read.
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsReadApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Hook to delete a notification.
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotificationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Hook for event organizers to broadcast an announcement to event attendees.
 */
export const useBroadcastAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      title,
      message,
    }: {
      eventId: string;
      title: string;
      message: string;
    }) => broadcastAnnouncementApi(eventId, title, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

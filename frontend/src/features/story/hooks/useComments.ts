import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { useSessionStore } from "@/src/stores/session.store";

import {
  createCommentApi,
  getCommentsApi,
  getRepliesApi,
  likeCommentApi,
} from "../api/comments.api";
import {
  incrementReplyCount,
  InfiniteCommentData,
  prependCommentToPages,
  toggleCachedCommentLike,
} from "../utils/commentQueryUtils";

/**
 * Custom hook to fetch, cache, and manage top-level comments for a specific story.
 * @param storyId
 */
export const useComments = (storyId: string) => {
  const queryClient = useQueryClient();

  // 🚨 THE FIX: Explicitly grab the full user object so the mutation can use it
  const user = useSessionStore((state) => state.user);
  const userId = user?.id;

  // CRITICAL SECURITY FIX: Append userId to isolate the cache per user session
  const queryKey = ["comments", storyId, userId];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      getCommentsApi(storyId, pageParam as string | undefined, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
    enabled: !!storyId,
  });

  const comments = data?.pages.flatMap((page: any) => page.data) || [];

  const addCommentMutation = useMutation({
    mutationFn: ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string;
    }) => createCommentApi(storyId, { content, parentId }),
    onSuccess: (apiResponse) => {
      const newComment = apiResponse;

      // 🚨 Inject the logged-in user's details instantly
      if (
        user &&
        (!newComment.userId ||
          typeof newComment.userId === "string" ||
          !newComment.userId.name)
      ) {
        newComment.userId = {
          _id: user.id,
          name: user.name,
        };
      }

      if (newComment.parentId) {
        queryClient.setQueryData<InfiniteCommentData>(queryKey, (oldData) =>
          incrementReplyCount(oldData, newComment.parentId as string),
        );
        queryClient.invalidateQueries({
          queryKey: ["replies", newComment.parentId, userId],
        });
        return;
      }

      queryClient.setQueryData<InfiniteCommentData>(queryKey, (oldData) =>
        prependCommentToPages(oldData, newComment),
      );
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (commentId: string) => likeCommentApi(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData =
        queryClient.getQueryData<InfiniteCommentData>(queryKey);

      queryClient.setQueryData<InfiniteCommentData>(queryKey, (oldData) =>
        toggleCachedCommentLike(oldData, commentId),
      );

      return { previousData };
    },
    onError: (err, commentId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
  });

  return {
    comments,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    addComment: addCommentMutation.mutateAsync,
    toggleLike: toggleLikeMutation.mutateAsync,
  };
};

/**
 * Custom hook to fetch, cache, and manage nested replies for a specific parent comment.
 * @param commentId
 * @param enabled
 */
export const useCommentReplies = (commentId: string, enabled = false) => {
  const queryClient = useQueryClient();

  // 🚨 THE FIX: Grab the full user object here as well!
  const user = useSessionStore((state) => state.user);
  const userId = user?.id;

  const queryKey = ["replies", commentId, userId];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      getRepliesApi(commentId, pageParam as string | undefined, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
    enabled: !!commentId && enabled,
  });

  const replies = data?.pages.flatMap((page: any) => page.data) || [];

  const addReplyMutation = useMutation({
    mutationFn: ({ storyId, content }: { storyId: string; content: string }) =>
      createCommentApi(storyId, { content, parentId: commentId }),
    onSuccess: (apiResponse) => {
      const actualReply = apiResponse;

      // 🚨 Inject user details into replies
      if (
        user &&
        (!actualReply.userId ||
          typeof actualReply.userId === "string" ||
          !actualReply.userId.name)
      ) {
        actualReply.userId = {
          _id: user.id,
          name: user.name,
        };
      }

      queryClient.setQueryData<InfiniteCommentData>(queryKey, (oldData) =>
        prependCommentToPages(oldData, actualReply),
      );
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (replyId: string) => likeCommentApi(replyId),
    onMutate: async (replyId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData =
        queryClient.getQueryData<InfiniteCommentData>(queryKey);

      queryClient.setQueryData<InfiniteCommentData>(queryKey, (oldData) =>
        toggleCachedCommentLike(oldData, replyId),
      );

      return { previousData };
    },
    onError: (err, replyId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
  });

  return {
    replies,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    addReply: addReplyMutation.mutateAsync,
    toggleLike: toggleLikeMutation.mutateAsync,
  };
};

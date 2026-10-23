import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { IconWithBadge } from "@/src/components/icons/IconWithBadge";

import { useCommentReplies } from "../hooks/useComments";
import { StoryComment } from "../types/comment.types";
import { formatStoryDate } from "../utils/storyUtils";

interface CommentItemProps {
  comment: StoryComment;
  onReply: (commentId: string, userName: string) => void;
  onLike: (commentId: string) => void;
  isReply?: boolean;
}

/**
 * Renders a story comment and optionally its nested replies.
 *
 * @param root0 - Comment item props.
 * @param root0.comment - Comment data to render.
 * @param root0.onReply - Callback to start replying.
 * @param root0.onLike - Callback to toggle comment like state.
 * @param root0.isReply - Whether this item is rendered as a reply.
 * @returns The rendered comment item.
 */
export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  isReply = false,
}) => {
  const [showReplies, setShowReplies] = useState(false);

  // We conditionally call the hook. It only fetches if enabled (when showReplies is true)
  const { replies, isLoading, hasNextPage, fetchNextPage, toggleLike } =
    useCommentReplies(comment._id, showReplies);

  return (
    <View className={`mb-4 ${isReply ? "ml-12 mt-2" : ""}`}>
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 overflow-hidden rounded-full bg-surface-gray">
          {/* Avatar Placeholder / Image */}
          <View className="flex-1 items-center justify-center bg-neutral-200">
            <Text className="font-nunito-bold text-neutral-500">
              {comment.userId?.name?.charAt(0) || "?"}
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-nunito-semibold text-body text-neutral">
              {comment.userId?.name || "Unknown User"}
            </Text>
            <Text className="text-small text-neutral-gray">
              {formatStoryDate(comment.createdAt)}
            </Text>
          </View>

          <Text className="mt-1 font-nunito text-body text-neutral-dark">
            {comment.content}
          </Text>

          <View className="mt-2 flex-row items-center gap-6">
            {!isReply && (
              <Pressable
                accessibilityRole="button"
                onPress={() => onReply(comment._id, comment.userId.name)}
              >
                <Text className="font-nunito-semibold text-small text-primary">
                  reply
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View className="ml-2 pt-1">
          <Pressable
            accessibilityRole="button"
            onPress={() => onLike(comment._id)}
            hitSlop={10}
          >
            <IconWithBadge
              iconName="pray"
              count={comment.likeCount}
              color={
                comment.isLiked ? colors.primary.DEFAULT : colors.neutral.light
              }
            />
          </Pressable>
        </View>
      </View>

      {/* Replies Thread */}
      {!isReply && comment.replyCount > 0 && (
        <View className="mt-2">
          {!showReplies ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowReplies(true)}
              className="ml-12 flex-row items-center py-2"
            >
              <View className="mr-3 h-[1px] w-8 bg-surface-gray" />
              <Text className="font-nunito-semibold text-small text-neutral-gray">
                View {comment.replyCount} replies
              </Text>
            </Pressable>
          ) : (
            <View>
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary.DEFAULT}
                  className="my-2 ml-12"
                />
              )}
              {replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  onReply={() => onReply(comment._id, reply.userId.name)}
                  onLike={toggleLike}
                  isReply
                />
              ))}
              {hasNextPage && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => fetchNextPage()}
                  className="ml-12 flex-row items-center py-2"
                >
                  <View className="mr-3 h-[1px] w-8 bg-surface-gray" />
                  <Text className="font-nunito-semibold text-small text-neutral-gray">
                    View more replies
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

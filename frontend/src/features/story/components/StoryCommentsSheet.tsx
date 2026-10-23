import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import { colors } from "@/constants/theme";

import { useComments } from "../hooks/useComments";
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";

import { CommentInputBar } from "./CommentInputBar";
import { CommentItem } from "./CommentItem";

interface StoryCommentsSheetProps {
  storyId: string;
  commentCount: number;
}

const handleIndicatorStyle = {
  backgroundColor: colors.neutral.lightest,
  width: 40,
};

const backgroundStyle = {
  borderRadius: 24,
  backgroundColor: colors.surface.DEFAULT,
};

export const StoryCommentsSheet = forwardRef<
  BottomSheetModal,
  StoryCommentsSheetProps
>(({ storyId, commentCount }, ref) => {
  const snapPoints = useMemo(() => ["90%"], []);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    userName: string;
  } | null>(null);
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const lastFetchMoreRef = useRef(0);
  const contentContainerStyle = useMemo(
    () => ({
      padding: 16,
      paddingBottom: Math.max(120 + insets.bottom, keyboardHeight + 32),
    }),
    [insets.bottom, keyboardHeight],
  );

  const {
    comments,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    addComment,
    toggleLike,
  } = useComments(storyId);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    [],
  );

  const handleReply = useCallback((commentId: string, userName: string) => {
    setReplyingTo({ commentId, userName });
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleSubmit = useCallback(
    async (content: string) => {
      if (replyingTo) {
        await addComment({ content, parentId: replyingTo.commentId });
        setReplyingTo(null);
      } else {
        await addComment({ content });
      }
    },
    [addComment, replyingTo],
  );

  const handleEndReached = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchMoreRef.current < 700) return;
    lastFetchMoreRef.current = now;
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <CommentInputBar
          onSubmit={handleSubmit}
          replyingToUser={replyingTo?.userName}
          onCancelReply={handleCancelReply}
        />
      </BottomSheetFooter>
    ),
    [handleCancelReply, handleSubmit, replyingTo?.userName],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const paddingToBottom = 150; // Trigger when 150px from bottom

      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      ) {
        const now = Date.now();
        if (now - lastFetchMoreRef.current < 700) return;
        lastFetchMoreRef.current = now;
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      handleIndicatorStyle={handleIndicatorStyle}
      backgroundStyle={backgroundStyle}
      footerComponent={renderFooter}
    >
      <View className="flex-1">
        <View className="border-b border-surface-gray px-4 py-3">
          <Text className="font-nunito-bold text-lg text-neutral-black">
            {commentCount} comments
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : (
          <BottomSheetScrollView
            onScroll={handleScroll}
            contentContainerStyle={contentContainerStyle}
          >
            {comments.length === 0 ? (
              <View className="mt-8 items-center justify-center">
                <Text className="font-nunito text-neutral-gray">
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            ) : (
              comments.map((item) => (
                <CommentItem
                  key={item._id}
                  comment={item}
                  onReply={handleReply}
                  onLike={toggleLike}
                />
              ))
            )}

            {isFetchingNextPage && (
              <ActivityIndicator
                size="small"
                color={colors.primary.DEFAULT}
                className="my-4"
              />
            )}
          </BottomSheetScrollView>
        )}
      </View>
    </BottomSheetModal>
  );
});

StoryCommentsSheet.displayName = "StoryCommentsSheet";

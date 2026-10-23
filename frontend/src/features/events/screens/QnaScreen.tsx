import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/src/features/auth/stores/auth.store";

import { EventTabBar } from "../components/EventTabBar";
import { useEventDetails } from "../hooks/useEventDetails";
import { useEventQna, usePostQnaMessage, usePostQnaReply } from "../hooks/useEventQna";
import type { QnaMessage } from "../types";

const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/219/219970.png";

interface QnaScreenProps {
  eventId: string;
}

/**
 * Q&A screen for a specific event.
 * Displays threaded questions and answers. Any user can ask a question;
 * anyone can reply. Only joined users and organizers see this tab.
 *
 * @param root0 - Component props.
 * @param root0.eventId - The numeric event identifier.
 * @returns {JSX.Element} The rendered Q&A screen.
 */
export function QnaScreen({
  eventId,
}: QnaScreenProps): React.JSX.Element {
  const scrollRef = useRef<ScrollView>(null);

  const user = useAuthStore((s) => s.user);
  const { data: event } = useEventDetails(eventId);
  const { data: messages = [], isLoading } = useEventQna(eventId);
  const postMessageMutation = usePostQnaMessage(eventId);
  const postReplyMutation = usePostQnaReply(eventId);

  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    messageId: string;
    authorId: number;
    authorName: string;
  } | null>(null);
  const [visibleReplies, setVisibleReplies] = useState<Set<string>>(new Set());

  const isOrganizer =
    !!event?.createdBy && String(event.createdBy.userId) === String(user?.userId);
  const isJoined = event?.isJoined ?? false;
  const hasAccess = isOrganizer || isJoined;
  const userId = user?.userId ? Number(user.userId) : 0;

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

  const handlePost = useCallback(() => {
    const text = inputText.trim();
    if (!text || !userId) return;

    if (replyingTo) {
      const tagPattern = new RegExp(`^@${replyingTo.authorName}\\s+`, "i");
      const content = text.replace(tagPattern, "").trim();

      postReplyMutation.mutate(
        {
          eventId,
          messageId: replyingTo.messageId,
          authorId: userId,
          taggedId: replyingTo.authorId,
          content,
        },
        {
          onSuccess: () => {
            setInputText("");
            setReplyingTo(null);
          },
          onError: () =>
            Alert.alert("Error", "Failed to post reply. Please try again."),
        },
      );
    } else {
      postMessageMutation.mutate(
        { eventId, authorId: userId, content: text },
        {
          onSuccess: () => setInputText(""),
          onError: () =>
            Alert.alert("Error", "Failed to post message. Please try again."),
        },
      );
    }
  }, [inputText, userId, replyingTo, eventId, postReplyMutation, postMessageMutation]);

  const handleReplyClick = useCallback(
    (messageId: string, authorId: number, authorName: string) => {
      setReplyingTo({ messageId, authorId, authorName });
      setInputText(`@${authorName} `);
    },
    [],
  );

  const toggleReplies = useCallback((messageId: string) => {
    setVisibleReplies((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  const getTimeAgo = (date: string | Date): string => {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  const isPending =
    postMessageMutation.isPending || postReplyMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top bar */}
      <View className="mt-8 flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <EventTabBar eventId={eventId} hasAccess={hasAccess} />

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 8 }}
        onContentSizeChange={scrollToBottom}
        keyboardDismissMode="on-drag"
      >
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#01A39F" />
          </View>
        ) : messages.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="px-6 text-center font-nunito text-[14px] text-neutral-light">
              No messages yet. Be the first to ask a question!
            </Text>
          </View>
        ) : (
          messages.map((msg) => (
            <QnaMessageRow
              key={msg._id}
              message={msg}
              currentUserId={userId}
              organizerId={
                event?.createdBy?.userId
                  ? Number(event.createdBy.userId)
                  : null
              }
              repliesVisible={visibleReplies.has(msg._id)}
              onReply={handleReplyClick}
              onToggleReplies={toggleReplies}
              getTimeAgo={getTimeAgo}
            />
          ))
        )}
      </ScrollView>

      {/* Divider */}
      <View className="h-[1px] bg-neutral-lightest" />

      {/* Reply indicator */}
      {replyingTo && (
        <View className="flex-row items-center justify-between bg-primary-surface px-4 py-2">
          <Text className="font-nunito text-[13px] text-neutral-dark">
            Replying to{" "}
            <Text className="font-nunito-bold">{replyingTo.authorName}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => {
              setReplyingTo(null);
              setInputText("");
            }}
          >
            <Text className="font-nunito text-[13px] text-neutral-light">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input bar */}
      <View className="flex-row items-end gap-2 px-4 pb-6 pt-3">
        <View className="flex-1 rounded-2xl border border-neutral-lightest bg-surface-gray px-4 py-2">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={replyingTo ? "Write a reply..." : "Ask a question..."}
            placeholderTextColor="#8E8E93"
            multiline
            className="font-nunito text-[15px] text-neutral-black"
            style={{ maxHeight: 100 }}
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!inputText.trim() || isPending}
          className="mb-1 h-10 items-center justify-center px-3"
          accessibilityRole="button"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#01A39F" />
          ) : (
            <Text
              className={
                inputText.trim()
                  ? "font-nunito-bold text-[15px] text-primary"
                  : "font-nunito-bold text-[15px] text-neutral-light"
              }
            >
              POST
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ── Private sub-components ───────────────────────── */

interface QnaMessageRowProps {
  message: QnaMessage;
  currentUserId: number;
  organizerId: number | null;
  repliesVisible: boolean;
  onReply: (messageId: string, authorId: number, authorName: string) => void;
  onToggleReplies: (messageId: string) => void;
  getTimeAgo: (date: string | Date) => string;
}

function QnaMessageRow({
  message,
  currentUserId,
  organizerId,
  repliesVisible,
  onReply,
  onToggleReplies,
  getTimeAgo,
}: QnaMessageRowProps): React.JSX.Element {
  const isCurrentUser = message.authorId === currentUserId;
  const isAuthor = message.authorId === organizerId;
  const hasReplies = message.replies?.length > 0;

  return (
    <View>
      <View className="flex-row items-start px-4 py-4">
        <Image
          source={{ uri: message.authorPhoto || FALLBACK_AVATAR }}
          style={{ height: 48, width: 48, borderRadius: 24 }}
          contentFit="cover"
        />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-nunito-bold text-[15px] text-neutral-black">
              {message.authorName}
            </Text>
            {isCurrentUser && (
              <Text className="font-nunito text-[12px] text-neutral-light">
                (You)
              </Text>
            )}
            {isAuthor && !isCurrentUser && (
              <Text className="font-nunito text-[12px] text-primary">
                (Organizer)
              </Text>
            )}
          </View>
          <Text className="mt-0.5 font-nunito text-[14px] text-neutral-dark">
            {message.content}
          </Text>
          <View className="mt-2 flex-row gap-6">
            <Text className="font-nunito text-[13px] text-neutral-light">
              {getTimeAgo(message.timeSent)}
            </Text>
            <TouchableOpacity
              onPress={() =>
                onReply(message._id, message.authorId, message.authorName)
              }
            >
              <Text className="font-nunito text-[13px] text-neutral-light">
                Reply
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toggle replies */}
          {hasReplies && (
            <TouchableOpacity
              className="mt-2 flex-row items-center gap-2"
              onPress={() => onToggleReplies(message._id)}
            >
              <View className="h-[1px] w-4 bg-neutral-lightest" />
              <Text className="font-nunito text-[13px] text-neutral-light">
                {repliesVisible
                  ? "Hide Replies"
                  : `Show Replies (${message.replies.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Replies */}
      {hasReplies && repliesVisible && (
        <View className="ml-14 border-l-2 border-neutral-lightest pl-4 pr-4">
          {message.replies.map((reply) => {
            const isReplyCurrentUser = reply.authorId === currentUserId;
            const isReplyAuthor = reply.authorId === organizerId;
            return (
              <View key={reply._id} className="mb-3 flex-row items-start">
                <Image
                  source={{ uri: reply.authorPhoto || FALLBACK_AVATAR }}
                  style={{ height: 40, width: 40, borderRadius: 20 }}
                  contentFit="cover"
                />
                <View className="ml-2 flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-nunito-bold text-[14px] text-neutral-black">
                      {reply.authorName}
                    </Text>
                    {isReplyCurrentUser && (
                      <Text className="font-nunito text-[12px] text-neutral-light">
                        (You)
                      </Text>
                    )}
                    {isReplyAuthor && !isReplyCurrentUser && (
                      <Text className="font-nunito text-[12px] text-primary">
                        (Organizer)
                      </Text>
                    )}
                  </View>
                  <Text className="mt-0.5 font-nunito text-[14px] text-neutral-dark">
                    {reply.taggedName && (
                      <Text className="font-nunito-bold text-primary">
                        @{reply.taggedName}{" "}
                      </Text>
                    )}
                    {reply.content}
                  </Text>
                  <View className="mt-1 flex-row gap-6">
                    <Text className="font-nunito text-[13px] text-neutral-light">
                      {getTimeAgo(reply.timeSent)}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        onReply(
                          message._id,
                          reply.authorId,
                          reply.authorName,
                        )
                      }
                    >
                      <Text className="font-nunito text-[13px] text-neutral-light">
                        Reply
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

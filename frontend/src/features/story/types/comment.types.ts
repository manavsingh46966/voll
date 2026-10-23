export interface CommentAuthor {
  _id: string;
  name: string;
}

export interface StoryComment {
  _id: string;
  storyId: string;
  userId: CommentAuthor;
  content: string;
  parentId: string | null;
  likeCount: number;
  likes?: string[];
  isLiked: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  content: string;
  parentId?: string;
}

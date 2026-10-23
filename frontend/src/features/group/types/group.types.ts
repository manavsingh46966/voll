export interface GroupMember {
  id: string;
  name: string | null;
  email?: string | null;
  city?: string | null;
  bio?: string;
  profileImageUrl?: string | null;
}

export interface GroupAuthor {
  id: string;
  name: string | null;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  photoMimeType: string | null;
  hasPhoto: boolean;
  author: GroupAuthor | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupDetail extends GroupSummary {
  admins: GroupMember[];
  members: GroupMember[];
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  photoData?: string;
  photoMimeType?: string;
  initialMembers?: string[];
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  photoData?: string;
  photoMimeType?: string;
}

export interface AvailableUser {
  id: string;
  name: string | null;
  city: string | null;
  bio: string;
  profileImageUrl: string | null;
  followersCount: number;
  isFollowing: boolean;
  followsYou: boolean;
}

export interface AvailableUsersPage {
  users: AvailableUser[];
  nextCursor: string | null;
}

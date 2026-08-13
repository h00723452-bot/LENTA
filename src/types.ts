export interface User {
  id: string;
  username: string;
  createdAt: number;
  isPremium?: boolean;
  avatarUrl?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorIsPremium?: boolean;
  authorAvatarUrl?: string;
  content: string;
  createdAt: number;
  likesCount: number;
  userHasLiked?: boolean;
  imageUrl?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorIsPremium?: boolean;
  authorAvatarUrl?: string;
  content: string;
  createdAt: number;
  imageUrl?: string;
}

export interface Message {
  id: string;
  participants: string[];
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: number;
  read: boolean;
}

export interface Conversation {
  otherUserId: string;
  otherUsername: string;
  otherUserIsPremium?: boolean;
  otherUserAvatarUrl?: string;
  lastMessage: Message;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'tip_received' | 'withdrawal';
  amount: number;
  fromUserId?: string;
  createdAt: number;
}

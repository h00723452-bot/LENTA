import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, deleteDoc, setDoc, query, collection, where, onSnapshot, increment, updateDoc, getDocs } from 'firebase/firestore';
import { Post, User } from './types';
import { Heart, MessageSquare, Gift } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Comments from './Comments';
import UserDisplay from './UserDisplay';
import TipModal from './TipModal';

export default function PostItem({ post, currentUser }: { post: Post, currentUser: User }) {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    // Check if current user liked this post
    const q = query(collection(db, 'postLikes'), where('postId', '==', post.id), where('userId', '==', currentUser.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsLiked(!snapshot.empty);
    });
    return () => unsubscribe();
  }, [post.id, currentUser.id]);

  useEffect(() => {
    // Get comments count
    const q = query(collection(db, 'comments'), where('postId', '==', post.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCommentsCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [post.id]);

  const handleLike = async () => {
    const likeRef = doc(db, 'postLikes', `${post.id}_${currentUser.id}`);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, {
          postId: post.id,
          userId: currentUser.id,
          createdAt: Date.now()
        });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <UserDisplay username={post.authorUsername} isPremium={post.authorIsPremium} avatarUrl={post.authorAvatarUrl} size="sm" />
        <span className="text-xs text-neutral-500">
          {post.createdAt ? formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ru }) : 'только что'}
        </span>
      </div>
      
      {post.content && (
        <p className="text-neutral-200 whitespace-pre-wrap mb-3 leading-relaxed text-[15px]">
          {post.content}
        </p>
      )}

      {post.imageUrl && (
        <img 
          src={post.imageUrl} 
          alt="Фото поста" 
          className="w-full rounded-xl mb-4 object-cover border border-neutral-800" 
          loading="lazy" 
        />
      )}
      
      <div className="flex items-center space-x-6 text-neutral-500">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-white'}`}
        >
          <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm font-medium">{post.likesCount || 0}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(true)}
          className="flex items-center space-x-2 hover:text-white transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">{commentsCount}</span>
        </button>

        {currentUser.id !== post.authorId && (
          <button 
            onClick={() => setShowTipModal(true)}
            className="flex items-center space-x-2 hover:text-pink-400 transition-colors ml-auto text-pink-500/80"
          >
            <Gift className="w-5 h-5" />
            <span className="text-sm font-medium">Подарок</span>
          </button>
        )}
      </div>

      {showComments && (
        <Comments 
          post={post} 
          currentUser={currentUser} 
          onClose={() => setShowComments(false)} 
        />
      )}

      {showTipModal && (
        <TipModal post={post} onClose={() => setShowTipModal(false)} />
      )}
    </div>
  );
}

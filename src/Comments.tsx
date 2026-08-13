import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from './firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Post, User, Comment } from './types';
import { X, Send, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import UserDisplay from './UserDisplay';

import { compressImage } from './utils';

export default function Comments({ post, currentUser, onClose }: { post: Post, currentUser: User, onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', post.id),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [post.id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
         alert('Файл слишком большой! Максимальный размер 2MB.');
         return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && !imageFile) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await compressImage(imageFile, 800);
      }

      await addDoc(collection(db, 'comments'), {
        postId: post.id,
        authorId: currentUser.id,
        authorUsername: currentUser.username,
        authorIsPremium: currentUser.isPremium || false,
        ...(currentUser.avatarUrl ? { authorAvatarUrl: currentUser.avatarUrl } : {}),
        content: newComment.trim(),
        createdAt: Date.now(),
        ...(imageUrl ? { imageUrl } : {})
      });
      setNewComment('');
      removeImage();
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/95 backdrop-blur-xl animate-in slide-in-from-bottom-full duration-300">
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-900">
        <h2 className="text-lg font-medium text-white">Комментарии</h2>
        <button onClick={onClose} className="p-2 -mr-2 text-neutral-400 hover:text-white rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Original Post context */}
        <div className="pb-4 border-b border-neutral-900">
          <div className="flex items-center justify-between mb-3">
            <UserDisplay username={post.authorUsername} isPremium={post.authorIsPremium} avatarUrl={post.authorAvatarUrl} size="sm" />
            <span className="text-xs text-neutral-500">
              {post.createdAt ? formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ru }) : ''}
            </span>
          </div>
          {post.content && (
            <p className="text-neutral-300 text-[15px] leading-relaxed mb-3">{post.content}</p>
          )}
          {post.imageUrl && (
            <img 
              src={post.imageUrl} 
              alt="Фото поста" 
              className="w-full rounded-xl object-cover border border-neutral-800 opacity-80" 
              loading="lazy" 
            />
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id} className="group">
              <div className="flex items-center justify-between mb-2">
                <UserDisplay username={comment.authorUsername} isPremium={comment.authorIsPremium} avatarUrl={comment.authorAvatarUrl} size="sm" showAvatar={false} />
                <span className="text-xs text-neutral-500">
                  {comment.createdAt ? formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: ru }) : ''}
                </span>
              </div>
              {comment.content && (
                <p className="text-sm text-neutral-400 leading-relaxed mb-2 pl-2 border-l-2 border-neutral-800">{comment.content}</p>
              )}
              {comment.imageUrl && (
                <img 
                  src={comment.imageUrl} 
                  alt="Фото комментария" 
                  className="max-w-[80%] rounded-lg object-cover border border-neutral-800 mt-2" 
                  loading="lazy" 
                />
              )}
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center text-sm text-neutral-600 pt-8">
              Пока нет комментариев
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-neutral-900 bg-neutral-950 flex flex-col space-y-2">
        {imagePreview && (
          <div className="relative self-start mb-2">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover border border-neutral-800" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 border border-neutral-700 hover:bg-neutral-900"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        <form onSubmit={handleAddComment} className="flex items-center space-x-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-neutral-400 hover:text-white rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-neutral-700 transition-colors"
          />
          <button
            type="submit"
            disabled={(!newComment.trim() && !imageFile) || isSubmitting}
            className="p-2 bg-white text-black rounded-full disabled:opacity-50 hover:bg-neutral-200 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

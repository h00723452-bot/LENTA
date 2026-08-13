import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from './firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Post } from './types';
import PostItem from './PostItem';
import { Send, Image as ImageIcon, X } from 'lucide-react';

import { compressImage } from './utils';

export default function Feed({ user }: { user: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newPostContent.trim() && !imageFile) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await compressImage(imageFile, 800);
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.id,
        authorUsername: user.username,
        authorIsPremium: user.isPremium || false,
        ...(user.avatarUrl ? { authorAvatarUrl: user.avatarUrl } : {}),
        content: newPostContent.trim(),
        createdAt: Date.now(),
        likesCount: 0,
        ...(imageUrl ? { imageUrl } : {})
      });
      setNewPostContent('');
      removeImage();
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md px-4 py-4 border-b border-neutral-900">
        <h1 className="text-xl font-medium tracking-wide">Лента</h1>
      </div>

      <div className="p-4 border-b border-neutral-900">
        <form onSubmit={handleCreatePost} className="relative">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Что происходит в Пушенде?"
            className="w-full bg-transparent text-white placeholder-neutral-600 resize-none outline-none py-2 min-h-[80px]"
            maxLength={500}
          />
          
          {imagePreview && (
            <div className="relative inline-block mt-2 mb-2">
              <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl object-cover border border-neutral-800" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white hover:bg-black/80 transition-colors backdrop-blur-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-2 border-t border-neutral-900 pt-3">
            <div className="flex items-center space-x-2">
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
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs text-neutral-600">{newPostContent.length}/500</span>
              <button
                type="submit"
                disabled={(!newPostContent.trim() && !imageFile) || isSubmitting}
                className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm disabled:opacity-50 hover:bg-neutral-200 transition-colors"
              >
                {isSubmitting ? 'Публикация...' : 'Опубликовать'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="flex flex-col divide-y divide-neutral-900">
        {posts.map(post => (
          <PostItem key={post.id} post={post} currentUser={user} />
        ))}
        {posts.length === 0 && (
          <div className="p-8 text-center text-neutral-600">
            Нет постов. Будьте первым!
          </div>
        )}
      </div>
    </div>
  );
}

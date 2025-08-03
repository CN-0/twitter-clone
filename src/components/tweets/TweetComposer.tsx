import React, { useState } from 'react';
import { Image, Smile, Calendar, MapPin, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface TweetComposerProps {
  onTweetCreated?: () => void;
  replyToId?: number;
  quoteTweetId?: number;
  placeholder?: string;
}

const TweetComposer: React.FC<TweetComposerProps> = ({ 
  onTweetCreated, 
  replyToId, 
  quoteTweetId,
  placeholder = "What's happening?"
}) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  const { user } = useAuth();
  const characterLimit = 280;
  const remainingChars = characterLimit - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      await apiService.createTweet(content, imageUrl, replyToId, quoteTweetId);
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      onTweetCreated?.();
    } catch (error) {
      console.error('Error creating tweet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex space-x-3">
        <img
          src={user?.verified ? 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=40&h=40&fit=crop&crop=face' : 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=40&h=40&fit=crop&crop=face'}
          alt="Your avatar"
          className="h-12 w-12 rounded-full object-cover"
        />
        
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xl placeholder-gray-500 dark:placeholder-gray-400 bg-transparent text-gray-900 dark:text-white resize-none border-none focus:outline-none"
              rows={3}
              maxLength={characterLimit}
            />

            {showImageInput && (
              <div className="mt-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Image
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageInput(false);
                      setImageUrl('');
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {imageUrl && (
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-full h-32 object-cover rounded-lg"
                      onError={() => setImageUrl('')}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                >
                  <Image className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                >
                  <Calendar className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                >
                  <MapPin className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`text-sm ${
                    remainingChars < 20
                      ? remainingChars < 0
                        ? 'text-red-500'
                        : 'text-yellow-500'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {remainingChars}
                </span>
                <button
                  type="submit"
                  disabled={!content.trim() || remainingChars < 0 || loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-full transition-colors duration-200"
                >
                  {loading ? 'Posting...' : replyToId ? 'Reply' : 'Tweet'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TweetComposer;
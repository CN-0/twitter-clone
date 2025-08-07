@@ .. @@
 -- Admin users table
 CREATE TABLE IF NOT EXISTS admin_users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     UNIQUE(user_id)
 );
 
+-- Twitter tokens table
+CREATE TABLE IF NOT EXISTS twitter_tokens (
+    id INTEGER PRIMARY KEY AUTOINCREMENT,
+    user_id INTEGER NOT NULL,
+    access_token TEXT NOT NULL,
+    access_token_secret TEXT NOT NULL,
+    twitter_user_id TEXT NOT NULL,
+    twitter_username TEXT NOT NULL,
+    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
+    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
+    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
+    UNIQUE(user_id)
+);
+
 -- Scraping targets table
 CREATE TABLE IF NOT EXISTS scraping_targets (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT UNIQUE NOT NULL,
     is_active BOOLEAN DEFAULT TRUE,
     last_scraped_at DATETIME DEFAULT NULL,
     tweets_scraped INTEGER DEFAULT 0,
+    last_tweet_id TEXT DEFAULT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
 );
 
 -- Create indexes for better performance
 CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON tweets(user_id);
 CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at);
 CREATE INDEX IF NOT EXISTS idx_tweets_reply_to_id ON tweets(reply_to_id);
 CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
 CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
 CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
 CREATE INDEX IF NOT EXISTS idx_likes_tweet_id ON likes(tweet_id);
 CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
 CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
 CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
+CREATE INDEX IF NOT EXISTS idx_twitter_tokens_user_id ON twitter_tokens(user_id);
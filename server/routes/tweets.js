import express from 'express';

const createTweetRoutes = (db, authenticateToken) => {
  const router = express.Router();
  const database = db.getDb();

  // Get timeline tweets
  router.get('/timeline', authenticateToken, async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Get tweets from followed users and own tweets
      const query = `
        SELECT 
          t.*,
          u.username,
          u.display_name,
          u.profile_picture,
          u.verified,
          (SELECT COUNT(*) FROM likes WHERE tweet_id = t.id) as like_count,
          (SELECT COUNT(*) FROM tweets WHERE retweet_of_id = t.id) as retweet_count,
          (SELECT COUNT(*) FROM tweets WHERE reply_to_id = t.id) as reply_count,
          (SELECT COUNT(*) > 0 FROM likes WHERE tweet_id = t.id AND user_id = ?) as is_liked,
          (SELECT COUNT(*) > 0 FROM bookmarks WHERE tweet_id = t.id AND user_id = ?) as is_bookmarked,
          rt_user.username as retweet_username,
          rt_user.display_name as retweet_display_name,
          original_tweet.content as original_content,
          original_user.username as original_username,
          original_user.display_name as original_display_name,
          original_user.profile_picture as original_profile_picture
        FROM tweets t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN tweets original_tweet ON t.retweet_of_id = original_tweet.id
        LEFT JOIN users original_user ON original_tweet.user_id = original_user.id
        LEFT JOIN users rt_user ON t.user_id = rt_user.id
        WHERE t.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = ?
          UNION
          SELECT ?
        )
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `;

      database.all(
        query,
        [req.user.id, req.user.id, req.user.id, req.user.id, limit, offset],
        (err, tweets) => {
          if (err) {
            console.error('Error fetching timeline:', err);
            return res.status(500).json({ error: 'Failed to fetch tweets' });
          }

          res.json({ tweets });
        }
      );
    } catch (error) {
      console.error('Timeline error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create tweet
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { content, imageUrl, replyToId, quoteTweetId } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Tweet content is required' });
      }

      if (content.length > 280) {
        return res.status(400).json({ error: 'Tweet cannot exceed 280 characters' });
      }

      database.run(
        'INSERT INTO tweets (user_id, content, image_url, reply_to_id, quote_tweet_id) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, content, imageUrl || '', replyToId || null, quoteTweetId || null],
        function(err) {
          if (err) {
            console.error('Error creating tweet:', err);
            return res.status(500).json({ error: 'Failed to create tweet' });
          }

          // Update user tweet count
          database.run(
            'UPDATE users SET tweet_count = tweet_count + 1 WHERE id = ?',
            [req.user.id]
          );

          // If it's a reply, update reply count
          if (replyToId) {
            database.run(
              'UPDATE tweets SET reply_count = reply_count + 1 WHERE id = ?',
              [replyToId]
            );
          }

          res.status(201).json({
            message: 'Tweet created successfully',
            tweet: {
              id: this.lastID,
              content,
              imageUrl,
              replyToId,
              quoteTweetId,
              createdAt: new Date().toISOString()
            }
          });
        }
      );
    } catch (error) {
      console.error('Create tweet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Like/unlike tweet
  router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
      const tweetId = req.params.id;
      
      // Check if already liked
      database.get(
        'SELECT id FROM likes WHERE user_id = ? AND tweet_id = ?',
        [req.user.id, tweetId],
        (err, existingLike) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingLike) {
            // Unlike
            database.run(
              'DELETE FROM likes WHERE user_id = ? AND tweet_id = ?',
              [req.user.id, tweetId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to unlike tweet' });
                }
                
                // Update like count
                database.run(
                  'UPDATE tweets SET like_count = like_count - 1 WHERE id = ?',
                  [tweetId]
                );

                res.json({ message: 'Tweet unliked', liked: false });
              }
            );
          } else {
            // Like
            database.run(
              'INSERT INTO likes (user_id, tweet_id) VALUES (?, ?)',
              [req.user.id, tweetId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to like tweet' });
                }

                // Update like count
                database.run(
                  'UPDATE tweets SET like_count = like_count + 1 WHERE id = ?',
                  [tweetId]
                );

                res.json({ message: 'Tweet liked', liked: true });
              }
            );
          }
        }
      );
    } catch (error) {
      console.error('Like tweet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Retweet
  router.post('/:id/retweet', authenticateToken, async (req, res) => {
    try {
      const tweetId = req.params.id;
      
      // Check if already retweeted
      database.get(
        'SELECT id FROM tweets WHERE user_id = ? AND retweet_of_id = ?',
        [req.user.id, tweetId],
        (err, existingRetweet) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingRetweet) {
            return res.status(400).json({ error: 'Already retweeted' });
          }

          // Create retweet
          database.run(
            'INSERT INTO tweets (user_id, content, retweet_of_id) VALUES (?, ?, ?)',
            [req.user.id, '', tweetId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to retweet' });
              }

              // Update retweet count
              database.run(
                'UPDATE tweets SET retweet_count = retweet_count + 1 WHERE id = ?',
                [tweetId]
              );

              res.json({ message: 'Tweet retweeted successfully', retweeted: true });
            }
          );
        }
      );
    } catch (error) {
      console.error('Retweet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Bookmark tweet
  router.post('/:id/bookmark', authenticateToken, async (req, res) => {
    try {
      const tweetId = req.params.id;
      
      // Check if already bookmarked
      database.get(
        'SELECT id FROM bookmarks WHERE user_id = ? AND tweet_id = ?',
        [req.user.id, tweetId],
        (err, existingBookmark) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingBookmark) {
            // Remove bookmark
            database.run(
              'DELETE FROM bookmarks WHERE user_id = ? AND tweet_id = ?',
              [req.user.id, tweetId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to remove bookmark' });
                }
                
                res.json({ message: 'Bookmark removed', bookmarked: false });
              }
            );
          } else {
            // Add bookmark
            database.run(
              'INSERT INTO bookmarks (user_id, tweet_id) VALUES (?, ?)',
              [req.user.id, tweetId],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to bookmark tweet' });
                }

                res.json({ message: 'Tweet bookmarked', bookmarked: true });
              }
            );
          }
        }
      );
    } catch (error) {
      console.error('Bookmark tweet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user tweets
  router.get('/user/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Get user's tweets
      const query = `
        SELECT 
          t.*,
          u.username,
          u.display_name,
          u.profile_picture,
          u.verified,
          (SELECT COUNT(*) FROM likes WHERE tweet_id = t.id) as like_count,
          (SELECT COUNT(*) FROM tweets WHERE retweet_of_id = t.id) as retweet_count,
          (SELECT COUNT(*) FROM tweets WHERE reply_to_id = t.id) as reply_count
        FROM tweets t
        JOIN users u ON t.user_id = u.id
        WHERE u.username = ? AND t.reply_to_id IS NULL
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `;

      database.all(query, [username, limit, offset], (err, tweets) => {
        if (err) {
          console.error('Error fetching user tweets:', err);
          return res.status(500).json({ error: 'Failed to fetch tweets' });
        }

        res.json({ tweets });
      });
    } catch (error) {
      console.error('User tweets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

export default createTweetRoutes;
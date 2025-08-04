import express from 'express';

const createUserRoutes = (db, authenticateToken) => {
  const router = express.Router();
  const database = db.getDb();

  // Get current user (for auth context)
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      res.json({ user: req.user });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user profile
  router.get('/:username', async (req, res) => {
    try {
      const { username } = req.params;

      database.get(
        `SELECT 
          id, username, display_name, bio, profile_picture, cover_photo, 
          website, location, verified, follower_count, following_count, 
          tweet_count, created_at
         FROM users WHERE username = ?`,
        [username],
        (err, user) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }

          res.json({ user });
        }
      );
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Follow/unfollow user
  router.post('/:username/follow', authenticateToken, async (req, res) => {
    try {
      const { username } = req.params;

      // Get user to follow
      database.get(
        'SELECT id FROM users WHERE username = ?',
        [username],
        (err, userToFollow) => {
          if (err || !userToFollow) {
            return res.status(404).json({ error: 'User not found' });
          }

          if (userToFollow.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
          }

          // Check if already following
          database.get(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [req.user.id, userToFollow.id],
            (err, existingFollow) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              if (existingFollow) {
                // Unfollow
                database.run(
                  'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
                  [req.user.id, userToFollow.id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: 'Failed to unfollow' });
                    }

                    // Update counts
                    database.run(
                      'UPDATE users SET following_count = following_count - 1 WHERE id = ?',
                      [req.user.id]
                    );
                    database.run(
                      'UPDATE users SET follower_count = follower_count - 1 WHERE id = ?',
                      [userToFollow.id]
                    );

                    res.json({ message: 'Unfollowed successfully', following: false });
                  }
                );
              } else {
                // Follow
                database.run(
                  'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
                  [req.user.id, userToFollow.id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: 'Failed to follow' });
                    }

                    // Update counts
                    database.run(
                      'UPDATE users SET following_count = following_count + 1 WHERE id = ?',
                      [req.user.id]
                    );
                    database.run(
                      'UPDATE users SET follower_count = follower_count + 1 WHERE id = ?',
                      [userToFollow.id]
                    );

                    res.json({ message: 'Followed successfully', following: true });
                  }
                );
              }
            }
          );
        }
      );
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update profile
  router.put('/profile', authenticateToken, async (req, res) => {
    try {
      const { displayName, bio, website, location, profilePicture, coverPhoto } = req.body;

      database.run(
        `UPDATE users SET 
         display_name = ?, bio = ?, website = ?, location = ?, 
         profile_picture = ?, cover_photo = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [displayName, bio, website, location, profilePicture, coverPhoto, req.user.id],
        (err) => {
          if (err) {
            console.error('Error updating profile:', err);
            return res.status(500).json({ error: 'Failed to update profile' });
          }

          res.json({ message: 'Profile updated successfully' });
        }
      );
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Search users
  router.get('/search/:query', async (req, res) => {
    try {
      const { query } = req.params;
      const { limit = 10 } = req.query;

      database.all(
        `SELECT 
          id, username, display_name, bio, profile_picture, verified, follower_count
         FROM users 
         WHERE username LIKE ? OR display_name LIKE ?
         ORDER BY follower_count DESC
         LIMIT ?`,
        [`%${query}%`, `%${query}%`, limit],
        (err, users) => {
          if (err) {
            console.error('Error searching users:', err);
            return res.status(500).json({ error: 'Search failed' });
          }

          res.json({ users });
        }
      );
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

export default createUserRoutes;
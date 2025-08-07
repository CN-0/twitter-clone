import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateTokens, JWT_REFRESH_SECRET } from '../middleware/auth.js';
import { createOAuthClient } from '../config/twitter.js';
import TwitterScraperService from '../services/twitterScraper.js';

const createAuthRoutes = (db) => {
  const router = express.Router();
  const database = db.getDb();
  const twitterScraper = new TwitterScraperService(db);

  // Twitter OAuth routes
  router.get('/twitter', async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const oauthClient = createOAuthClient();
      const authLink = await oauthClient.generateAuthLink('http://localhost:3001/api/auth/twitter/callback', {
        linkMode: 'authorize'
      });

      // Store the oauth token and secret temporarily (you might want to use Redis in production)
      req.session = req.session || {};
      req.session.oauth_token = authLink.oauth_token;
      req.session.oauth_token_secret = authLink.oauth_token_secret;
      req.session.user_id = userId;

      res.json({ authUrl: authLink.url });
    } catch (error) {
      console.error('Twitter OAuth error:', error);
      res.status(500).json({ error: 'Failed to generate Twitter auth link' });
    }
  });

  router.get('/twitter/callback', async (req, res) => {
    try {
      const { oauth_token, oauth_verifier } = req.query;
      
      if (!oauth_token || !oauth_verifier) {
        return res.status(400).json({ error: 'Missing OAuth parameters' });
      }

      // Get stored OAuth tokens from session
      const storedToken = req.session?.oauth_token;
      const storedSecret = req.session?.oauth_token_secret;
      const userId = req.session?.user_id;

      if (!storedToken || !storedSecret || !userId) {
        return res.status(400).json({ error: 'Invalid OAuth session' });
      }

      const oauthClient = createOAuthClient();
      const loginResult = await oauthClient.login({
        oauth_token: storedToken,
        oauth_token_secret: storedSecret,
        oauth_verifier
      });

      // Store the user's Twitter tokens
      await twitterScraper.storeUserTwitterTokens(
        userId,
        loginResult.accessToken,
        loginResult.accessSecret,
        loginResult.userId,
        loginResult.screenName
      );

      // Clear session
      delete req.session.oauth_token;
      delete req.session.oauth_token_secret;
      delete req.session.user_id;

      // Redirect to admin dashboard
      res.redirect('http://localhost:5173/admin?twitter_auth=success');
    } catch (error) {
      console.error('Twitter callback error:', error);
      res.redirect('http://localhost:5173/admin?twitter_auth=error');
    }
  });

  // Register
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;

      if (!username || !email || !password || !displayName) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if user already exists
      database.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, existingUser) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }

          // Hash password and create user
          const hashedPassword = bcrypt.hashSync(password, 10);
          
          database.run(
            'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, displayName],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create user' });
              }

              const { accessToken, refreshToken } = generateTokens(this.lastID);

              // Store refresh token
              database.run(
                'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [this.lastID, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
                (err) => {
                  if (err) {
                    console.error('Error storing refresh token:', err);
                  }
                }
              );

              res.status(201).json({
                message: 'User created successfully',
                user: {
                  id: this.lastID,
                  username,
                  email,
                  displayName
                },
                accessToken,
                refreshToken
              });
            }
          );
        }
      );
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      database.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username],
        (err, user) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          const { accessToken, refreshToken } = generateTokens(user.id);

          // Store refresh token
          database.run(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
            (err) => {
              if (err) {
                console.error('Error storing refresh token:', err);
              }
            }
          );

          res.json({
            message: 'Login successful',
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              displayName: user.display_name,
              verified: user.verified
            },
            accessToken,
            refreshToken
          });
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Refresh token
  router.post('/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      // Verify refresh token
      database.get(
        'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > ?',
        [refreshToken, new Date()],
        (err, tokenRecord) => {
          if (err || !tokenRecord) {
            return res.status(403).json({ error: 'Invalid refresh token' });
          }

          try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

            // Delete old refresh token and store new one
            database.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
            database.run(
              'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
              [decoded.userId, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
            );

            res.json({
              accessToken,
              refreshToken: newRefreshToken
            });
          } catch (jwtError) {
            return res.status(403).json({ error: 'Invalid refresh token' });
          }
        }
      );
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout
  router.post('/logout', async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        database.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

export default createAuthRoutes;
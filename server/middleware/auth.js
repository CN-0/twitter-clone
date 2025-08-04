import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

const createAuthMiddleware = (db) => {
  const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from database using shared connection
      const database = db.getDb();
      
      database.get(
        'SELECT id, username, email, display_name, verified FROM users WHERE id = ?',
        [decoded.userId],
        (err, user) => {
          if (err || !user) {
            return res.status(403).json({ error: 'Invalid token' });
          }
          
          req.user = user;
          next();
        }
      );
    } catch (error) {
      return res.status(403).json({ error: 'Invalid token' });
    }
  };

  const authenticateAdmin = async (req, res, next) => {
    await authenticateToken(req, res, () => {
      const database = db.getDb();
      
      database.get(
        'SELECT * FROM admin_users WHERE user_id = ?',
        [req.user.id],
        (err, admin) => {
          if (err || !admin) {
            return res.status(403).json({ error: 'Admin access required' });
          }
          next();
        }
      );
    });
  };

  return { authenticateToken, authenticateAdmin };
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

export {
  createAuthMiddleware,
  generateTokens,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};
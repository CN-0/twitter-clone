import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from './database/init.js';

// Import route factories
import createAuthRoutes from './routes/auth.js';
import createTweetRoutes from './routes/tweets.js';
import createUserRoutes from './routes/users.js';
import createAdminRoutes from './routes/admin.js';

// Import middleware factories
import { createAuthMiddleware } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database connection
const db = new Database();
await db.connect();

// Create middleware with shared database
const { authenticateToken, authenticateAdmin } = createAuthMiddleware(db);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes with shared database
app.use('/api/auth', createAuthRoutes(db));
app.use('/api/tweets', createTweetRoutes(db, authenticateToken));
app.use('/api/users', createUserRoutes(db, authenticateToken));
app.use('/api/admin', createAdminRoutes(db, authenticateAdmin));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
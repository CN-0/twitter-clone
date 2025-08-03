# Twitter Clone - Social Media Platform

A comprehensive Twitter clone built with React, Node.js, Express, and SQLite, featuring tweet scraping capabilities for administrators.

## Features

### Core Social Media Features
- **User Authentication**: Complete signup, login, logout with JWT tokens and refresh token support
- **User Profiles**: Customizable profiles with bio, profile/cover photos, follower/following system
- **Tweet System**: 280-character tweets with emoji support, image attachments
- **Tweet Interactions**: Like, retweet, reply, quote tweet, bookmark functionality
- **Timeline**: Home timeline showing tweets from followed users
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Dark/Light Theme**: System-wide theme toggle with persistent preferences

### Administrative Features
- **Tweet Scraping**: Admin interface to scrape tweets from specified Twitter usernames
- **User Management**: Monitor platform statistics and user activity
- **Target Management**: Add, activate/deactivate scraping targets
- **Analytics Dashboard**: Real-time statistics on users, tweets, and scraping activity

### Technical Features
- **Secure Authentication**: JWT with refresh tokens, bcrypt password hashing
- **Rate Limiting**: Protection against API abuse
- **CORS Configuration**: Secure cross-origin requests
- **Database Optimization**: Indexed queries for better performance
- **Error Handling**: Comprehensive error handling and logging

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Context API** for state management

### Backend
- **Node.js** with Express
- **SQLite** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Express Rate Limit** for API protection

## Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Start the development servers:
```bash
npm run dev
```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:3001) servers concurrently.

### Default Admin Account

A default admin account is created automatically:
- **Username**: admin
- **Email**: admin@twitter.com  
- **Password**: admin123

Use this account to access the admin dashboard at `/admin`.

## Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts and profile information
- **tweets**: Tweet content and metadata
- **follows**: User following relationships
- **likes**: Tweet likes
- **bookmarks**: User bookmarks
- **notifications**: System notifications
- **refresh_tokens**: JWT refresh token management
- **admin_users**: Admin user roles
- **scraping_targets**: Tweet scraping configuration

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Tweets
- `GET /api/tweets/timeline` - Get timeline tweets
- `POST /api/tweets` - Create new tweet
- `POST /api/tweets/:id/like` - Like/unlike tweet
- `POST /api/tweets/:id/retweet` - Retweet
- `POST /api/tweets/:id/bookmark` - Bookmark tweet
- `GET /api/tweets/user/:username` - Get user tweets

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/:username` - Get user profile
- `POST /api/users/:username/follow` - Follow/unfollow user
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search/:query` - Search users

### Admin (Requires admin role)
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/scraping-targets` - Get scraping targets
- `POST /api/admin/scraping-targets` - Add scraping target
- `PUT /api/admin/scraping-targets/:id/toggle` - Toggle target status
- `POST /api/admin/scrape/:id` - Manual scrape trigger

## Tweet Scraping

The tweet scraping feature allows administrators to:

1. Add Twitter usernames to monitor
2. Activate/deactivate scraping for specific users
3. Manually trigger scraping operations
4. View scraping statistics and history

**Note**: The current implementation uses mock data for demonstration. In production, you would need to implement proper Twitter API integration following their terms of service and rate limiting guidelines.

## Security Features

- Password hashing with bcrypt
- JWT tokens with short expiration times
- Refresh token rotation
- Rate limiting on API endpoints
- CORS configuration
- SQL injection prevention with parameterized queries
- XSS protection with helmet

## Development

### Project Structure
```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth, Theme)
│   ├── services/          # API service layer
│   └── main.tsx           # Application entry point
├── server/                # Backend Node.js application
│   ├── database/          # Database schema and initialization
│   ├── middleware/        # Express middleware
│   ├── routes/           # API route handlers
│   └── app.js            # Server entry point
└── README.md             # This file
```

### Environment Variables

For production deployment, set these environment variables:

```bash
PORT=3001
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
NODE_ENV=production
```

## Deployment

1. Build the frontend:
```bash
npm run build
```

2. The built files will be in the `dist` directory and can be served by any static file server.

3. Deploy the backend to a Node.js hosting service with the appropriate environment variables set.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is for educational purposes. Please ensure compliance with Twitter's Terms of Service if implementing real tweet scraping functionality.
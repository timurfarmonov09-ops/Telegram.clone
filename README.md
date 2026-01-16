# Telegram Clone

A modern, real-time messaging application built with React, TypeScript, Node.js, and Socket.io.

## Features

- 🔐 User authentication (register/login)
- 📱 Phone number authentication
- 💬 Real-time messaging
- 🏠 Chat rooms and private conversations
- 👤 User profiles with avatar upload
- 🔍 User search functionality
- 📱 Responsive design
- 🔒 Secure JWT authentication
- 🗄️ MongoDB database

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Socket.io client for real-time communication
- Axios for HTTP requests

### Backend
- Node.js with Express
- Socket.io for WebSocket connections
- MongoDB database with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB 6.0+ (local or MongoDB Atlas)

### MongoDB Installation

#### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install MongoDB and MongoDB Compass (GUI tool)
3. Start MongoDB service:
```bash
net start MongoDB
```

#### macOS (using Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Using MongoDB Atlas (Cloud)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string and update `MONGODB_URI` in `.env`

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd telegram-clone
```

2. Install dependencies for all packages
```bash
npm run install-all
```

3. Configure environment variables
```bash
# Copy .env.example to .env in server directory
cd server
cp .env.example .env
# Update MONGODB_URI if needed
```

4. Start MongoDB (if using local installation)
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

5. Start the development servers
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:5173
- MongoDB on mongodb://localhost:27017

## Project Structure

```
telegram-clone/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── public/
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   └── utils/            # Server utilities
└── docs/                 # Documentation
```

## Development

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production

## API Endpoints

### Authentication
- `POST /api/auth/phone-register` - Phone number authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Profile
- `GET /api/profile/me` - Get user profile
- `PUT /api/profile/update` - Update profile (name, bio)
- `PUT /api/profile/photo` - Upload profile photo
- `DELETE /api/profile/photo` - Delete profile photo

### Users
- `GET /api/users/search?query=` - Search users
- `GET /api/users/:id` - Get user by ID

### Chats
- `GET /api/chats` - Get user's chats (authenticated)
- `POST /api/chats` - Create or get chat with user
- `GET /api/messages/:chatId` - Get messages for a chat (authenticated)

### WebSocket Events
- `join-chat` - Join a chat room
- `send-message` - Send a message
- `new-message` - Receive a new message

## License

MIT License
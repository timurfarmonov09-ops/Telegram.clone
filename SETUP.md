# Telegram Clone - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18 or higher
- **npm** or **yarn**
- **MongoDB** 6.0 or higher

## MongoDB Installation

### Windows

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Download the Windows installer (.msi)
   - Run the installer and follow the setup wizard
   - Choose "Complete" installation
   - Install MongoDB as a Windows Service (recommended)

2. **Install MongoDB Compass** (Optional GUI tool)
   - Included in the installer or download separately
   - Useful for viewing and managing your database

3. **Verify Installation**
   ```bash
   mongod --version
   ```

4. **Start MongoDB Service**
   ```bash
   net start MongoDB
   ```

### macOS

Using Homebrew:
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify installation
mongod --version
```

### Linux (Ubuntu/Debian)

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
mongod --version
```

### MongoDB Atlas (Cloud Option)

If you prefer not to install MongoDB locally:

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Create a database user
4. Whitelist your IP address
5. Get your connection string
6. Update `MONGODB_URI` in `server/.env` with your connection string

Example connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telegram-clone?retryWrites=true&w=majority
```

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd telegram-clone
```

### 2. Install Dependencies

Install all dependencies for both client and server:

```bash
npm run install-all
```

Or install separately:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

#### Server Configuration

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

3. Edit `.env` file with your settings:
   ```env
   PORT=3001
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=mongodb://localhost:27017/telegram-clone
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   ```

#### Client Configuration

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

3. Edit `.env` file:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

### 4. Start MongoDB

Make sure MongoDB is running:

**Windows:**
```bash
net start MongoDB
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

**Verify MongoDB is running:**
```bash
# Connect to MongoDB shell
mongosh
# or
mongo
```

### 5. Start the Application

From the root directory:

```bash
npm run dev
```

This will start:
- **Backend server** on http://localhost:3001
- **Frontend** on http://localhost:5173

Or start them separately:

```bash
# Terminal 1 - Start backend
npm run server

# Terminal 2 - Start frontend
npm run client
```

## Troubleshooting

### Port Already in Use

If port 3001 is already in use:

**Windows:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
```

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl status mongod
   ```

2. **Check MongoDB logs:**
   - Windows: `C:\Program Files\MongoDB\Server\6.0\log\mongod.log`
   - macOS: `/usr/local/var/log/mongodb/mongo.log`
   - Linux: `/var/log/mongodb/mongod.log`

3. **Verify connection string:**
   - Make sure `MONGODB_URI` in `.env` is correct
   - Default: `mongodb://localhost:27017/telegram-clone`

4. **Check firewall settings:**
   - Ensure port 27017 is not blocked

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or for both client and server
npm run install-all
```

### Build Errors

```bash
# Clear cache and rebuild
npm run clean
npm run install-all
```

## Development Commands

```bash
# Start both frontend and backend
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Install all dependencies
npm run install-all

# Build frontend for production
npm run build
```

## Database Management

### View Database with MongoDB Compass

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `telegram-clone`
4. View collections: `users`, `chats`, `messages`

### MongoDB Shell Commands

```bash
# Connect to MongoDB
mongosh

# Switch to telegram-clone database
use telegram-clone

# View all users
db.users.find().pretty()

# View all chats
db.chats.find().pretty()

# View all messages
db.messages.find().pretty()

# Drop database (careful!)
db.dropDatabase()
```

## Next Steps

1. Open http://localhost:5173 in your browser
2. Register a new account using phone number
3. Update your profile
4. Search for other users
5. Start chatting!

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [React Documentation](https://react.dev/)
- [Socket.io Documentation](https://socket.io/docs/)

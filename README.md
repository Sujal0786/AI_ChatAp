# AI-Powered Chat Application

A modern, real-time chat application built with the MERN stack, featuring AI-powered conversations, user authentication, and WhatsApp-like interface.

## Features

### 🔐 Authentication
- User registration and login with JWT authentication
- Password hashing with bcrypt
- Protected routes and middleware

### 💬 Real-time Chat
- Instant messaging between users using Socket.IO
- Online/offline status indicators
- Typing indicators
- Message delivery and read receipts
- Message timestamps

### 🤖 AI Assistant
- Integrated OpenAI GPT-3.5 chatbot
- Context-aware conversations
- Fallback responses for API errors

### 🎨 Modern UI
- WhatsApp-inspired responsive design
- Tailwind CSS for styling
- Mobile-friendly interface
- Emoji picker support
- Clean sidebar with conversation list

### 🔒 Security
- CORS protection
- Helmet for security headers
- Rate limiting
- Input validation and sanitization
- Environment variable configuration

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **OpenAI API** - AI chatbot integration

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Router** - Routing
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **Emoji Picker React** - Emoji support

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- OpenAI API key

### 1. Clone the repository
```bash
git clone <repository-url>
cd AI_ChatAp
```

### 2. Backend Setup
```bash
cd server
npm install
```

### 3. Frontend Setup
```bash
cd client
npm install
```

### 4. Environment Configuration

#### Backend (.env)
Copy `server/.env.example` to `server/.env` and configure:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ai-chat-app

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# CORS
CLIENT_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env)
Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5001/api
```

### 5. Start MongoDB
Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in server/.env with your Atlas connection string
```

### 6. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add it to your `server/.env` file

## Running the Application

### Development Mode

#### Start Backend (Terminal 1)
```bash
cd server
npm run dev
```
Server will run on http://localhost:5001

#### Start Frontend (Terminal 2)
```bash
cd client
npm run dev
```
Client will run on http://localhost:5174

### Production Mode

#### Backend
```bash
cd server
npm start
```

#### Frontend
```bash
cd client
npm run build
npm run preview
```

## Usage

1. **Register/Login**: Create an account or sign in
2. **Start Chatting**: 
   - Click on "AI Assistant" to chat with the AI
   - Search for users to start new conversations
   - Select existing conversations from the sidebar
3. **Real-time Features**:
   - See online/offline status
   - View typing indicators
   - Get message delivery confirmations
4. **AI Assistant**: Ask questions, get help, or have conversations with the AI

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/conversations` - Get user conversations
- `GET /api/users/search` - Search users

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/:userId` - Get conversation messages
- `PUT /api/messages/read/:conversationId` - Mark messages as read

## Socket Events

### Client to Server
- `joinConversation` - Join a conversation room
- `leaveConversation` - Leave a conversation room
- `sendMessage` - Send a message
- `typing` - Send typing indicator
- `markAsRead` - Mark messages as read

### Server to Client
- `newMessage` - Receive new message
- `messageReceived` - Confirm message sent
- `userOnline` - User came online
- `userOffline` - User went offline
- `userTyping` - User is typing
- `messageRead` - Message was read

## Deployment

### Frontend (Netlify)
1. Build the project: `cd client && npm run build`
2. Deploy the `dist` folder to Netlify
3. Update environment variables in Netlify dashboard

### Backend (Render/Heroku)
1. Create a new service on Render or Heroku
2. Connect your repository
3. Set environment variables
4. Deploy

### Environment Variables for Production
Update your production environment variables:
- `MONGODB_URI_PROD` - Production MongoDB connection
- `CLIENT_URL_PROD` - Production frontend URL
- `NODE_ENV=production`

## Project Structure

```
AI_ChatAp/
├── server/                 # Backend
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── socket/           # Socket.IO handlers
│   ├── utils/            # Utility functions
│   ├── .env              # Environment variables
│   ├── .env.example      # Environment template
│   ├── package.json      # Dependencies
│   └── server.js         # Entry point
├── client/                # Frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React contexts
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── .env              # Environment variables
│   ├── .env.example      # Environment template
│   ├── package.json      # Dependencies
│   └── vite.config.js    # Vite configuration
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity for Atlas

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure proper environment variable setup

3. **Socket Connection Issues**
   - Check CORS configuration
   - Verify client and server URLs
   - Ensure both frontend and backend are running

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

## License

MIT License - feel free to use this project for learning and development.

## Support

For issues and questions, please create an issue in the repository or contact the development team.
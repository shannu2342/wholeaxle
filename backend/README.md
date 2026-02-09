# Wholexale Backend Infrastructure

Comprehensive backend infrastructure for Wholexale.com B2B marketplace with real-time chat, notifications, and data synchronization.

## 🚀 Features

### Core Infrastructure
- **Express.js Server** - RESTful API with comprehensive middleware
- **Socket.io Integration** - Real-time messaging and notifications
- **MongoDB Database** - Primary data store with Mongoose ODM
- **PostgreSQL Database** - Analytics and complex queries
- **Redis Cache** - Session management and caching
- **JWT Authentication** - Secure token-based authentication

### Real-time Features
- **Live Chat System** - Real-time messaging with Socket.io
- **Typing Indicators** - Show when users are typing
- **Message Status** - Send, delivered, read receipts
- **Online Presence** - User online/offline status
- **Real-time Notifications** - Instant push notifications

### API Endpoints
- **Authentication** (`/api/auth/*`) - Login, register, profile management
- **Chat System** (`/api/chat/*`) - Conversations and messaging
- **Offers** (`/api/offers/*`) - Business offer management
- **Finance** (`/api/finance/*`) - Credits, payments, transactions
- **Notifications** (`/api/notifications/*`) - In-app notifications
- **File Upload** (`/api/upload/*`) - Media and document handling
- **Admin Panel** (`/api/admin/*`) - Administrative operations
- **System** (`/api/system/*`) - System events and health checks
- **Webhooks** (`/api/webhooks/*`) - External service integrations

### Security Features
- **Helmet.js** - Security headers
- **CORS Protection** - Cross-origin request handling
- **Rate Limiting** - API abuse prevention
- **Input Validation** - Request validation and sanitization
- **JWT Security** - Token-based authentication
- **Password Hashing** - bcrypt password encryption

### Communication Services
- **Email Service** - Nodemailer with template system
- **SMS Service** - Twilio integration
- **Push Notifications** - Web push notifications
- **Webhook Handling** - External service webhooks

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── errorHandler.js      # Error handling middleware
├── models/
│   ├── Chat.js              # Chat and conversation models
│   ├── Finance.js           # Finance and payment models
│   ├── Notification.js      # Notification model
│   ├── Offer.js             # Offer management model
│   └── User.js              # User model
├── routes/
│   ├── admin.js             # Admin panel routes
│   ├── auth.js              # Authentication routes
│   ├── chat.js              # Chat system routes
│   ├── finance.js           # Finance routes
│   ├── notifications.js     # Notification routes
│   ├── offers.js            # Offer management routes
│   ├── system.js            # System routes
│   ├── upload.js            # File upload routes
│   └── webhooks.js          # Webhook handling routes
├── services/
│   ├── email.js             # Email service
│   └── sms.js               # SMS service
├── socket/
│   └── handlers.js          # Socket.io event handlers
├── utils/
│   └── logger.js            # Logging utility
├── logs/                    # Log files directory
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── .env.example             # Environment variables template
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- PostgreSQL (v13 or higher) - Optional
- Redis (v6.0 or higher) - Optional

### 1. Clone and Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/wholexale
POSTGRES_URI=postgresql://user:password@localhost:5432/wholexale

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Database Setup

#### MongoDB
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### PostgreSQL (Optional)
```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Create database
createdb wholexale
```

#### Redis (Optional)
```bash
# Start Redis service
sudo systemctl start redis

# Or using Docker
docker run -d -p 6379:6379 --name redis redis:latest
```

### 4. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

## 🔧 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "businessName": "ABC Corp",
  "businessType": "manufacturer"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Chat Endpoints

#### Get Conversations
```http
GET /api/chat/conversations?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Messages
```http
GET /api/chat/messages/:conversationId?page=1&limit=50
Authorization: Bearer <token>
```

#### Send Message
```http
POST /api/chat/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "conversation_id",
  "content": "Hello, I'm interested in your product",
  "messageType": "text"
}
```

### Offer Endpoints

#### Create Offer
```http
POST /api/offers
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Bulk Order Request",
  "description": "I need 100 units of your product",
  "seller": "seller_id",
  "product": {
    "productId": "product_id",
    "name": "Product Name"
  },
  "pricing": {
    "originalPrice": 100,
    "offerPrice": 85
  },
  "quantity": {
    "requested": 100,
    "unit": "pieces"
  },
  "validity": {
    "endDate": "2024-01-15T00:00:00Z"
  }
}
```

#### Respond to Offer
```http
PUT /api/offers/:offerId/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "accept",
  "message": "Deal accepted!"
}
```

### Finance Endpoints

#### Get Credit Information
```http
GET /api/finance/credits
Authorization: Bearer <token>
```

#### Get Transactions
```http
GET /api/finance/transactions?page=1&limit=20
Authorization: Bearer <token>
```

## 🔌 Socket.io Events

### Connection
```javascript
const socket = io('http://localhost:8000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Chat Events
```javascript
// Join conversation
socket.emit('chat:join', { conversationId: 'conv_id' });

// Send message
socket.emit('chat:send', {
  conversationId: 'conv_id',
  content: 'Hello!',
  messageType: 'text'
});

// Typing indicators
socket.emit('typing:start', { conversationId: 'conv_id' });
socket.emit('typing:stop', { conversationId: 'conv_id' });
```

### Offer Events
```javascript
// Create offer
socket.emit('offer:create', {
  seller: 'seller_id',
  title: 'Bulk Order',
  // ... other offer data
});

// Respond to offer
socket.emit('offer:respond', {
  offerId: 'offer_id',
  action: 'accept',
  message: 'Deal accepted!'
});
```

## 📧 Email Templates

The system includes pre-built email templates:
- Email verification
- Password reset
- Offer notifications
- Payment confirmations
- System updates

## 📱 SMS Integration

SMS service includes templates for:
- OTP verification
- Payment notifications
- Order updates
- Security alerts

## 🔐 Security Features

### Rate Limiting
- API endpoints: 100 requests per 15 minutes per IP
- Socket connections: Throttled to prevent abuse

### Input Validation
- All inputs validated using express-validator
- SQL injection protection
- XSS prevention

### Authentication
- JWT tokens with refresh mechanism
- Password hashing with bcrypt
- Account lockout after failed attempts

## 📊 Monitoring & Logging

### Logging System
- Winston-based logging
- Different log levels (error, warn, info, debug)
- File rotation and size limits
- Structured logging with metadata

### Health Checks
```http
GET /health
```

### Database Health
```http
GET /api/system/health
Authorization: Bearer <token>
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb://production-mongo-url
POSTGRES_URI=postgresql://production-postgres-url
REDIS_URL=redis://production-redis-url
JWT_SECRET=production-jwt-secret
# ... other production configs
```

### Docker Deployment
```bash
# Build image
docker build -t wholexale-backend .

# Run container
docker run -d -p 8000:8000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://mongo:27017/wholexale \
  wholexale-backend
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## 📈 Performance Optimization

### Database Indexes
- Optimized indexes for all collections
- Compound indexes for complex queries
- Text indexes for search functionality

### Caching Strategy
- Redis for session management
- Query result caching
- Static file caching

### Real-time Optimizations
- Connection pooling
- Event batching
- Selective room joins

## 🔧 Development Tools

### Code Quality
```bash
npm run lint          # ESLint checking
npm run lint:fix      # Auto-fix ESLint issues
```

### Database Operations
```bash
npm run seed          # Seed database with test data
npm run migrate       # Run database migrations
```

## 📚 Additional Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [JWT.io](https://jwt.io/)
- [Winston Logger](https://github.com/winstonjs/winston)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Wholexale Backend Infrastructure** - Building the future of B2B commerce with real-time technology.
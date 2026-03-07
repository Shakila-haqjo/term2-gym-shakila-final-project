# High Street Gym - Backend API

Complete Node.js/Express/MySQL backend for High Street Gym Management System.

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MySQL connection pool
├── controllers/
│   ├── auth/
│   │   └── authController.js
│   ├── session/
│   │   └── sessionController.js
│   └── booking/
│       └── bookingController.js
├── middleware/
│   └── auth.js              # JWT authentication
├── routes/
│   ├── authRoutes.js
│   ├── sessionRoutes.js
│   ├── bookingRoutes.js
│   └── ...
├── database.sql             # Database schema
├── server.js                # Main server file
├── package.json
└── .env                     # Environment variables
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE high_street_gym;

# Import schema
mysql -u root -p high_street_gym < database.sql
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Update these values in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=high_street_gym
JWT_SECRET=your_super_secret_key_here
```

### 4. Start Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

## 📝 Default Credentials

Created by `database.sql`:

| Role    | Email              | Password    |
|---------|-------------------|-------------|
| Admin   | admin@gym.com     | admin123    |
| Trainer | trainer@gym.com   | trainer123  |
| Member  | member@gym.com    | member123   |

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login user
GET    /api/auth/me          # Get current user (requires token)
```

### Sessions
```
GET    /api/sessions                    # Get all sessions
GET    /api/sessions/:id                # Get session by ID
POST   /api/sessions                    # Create session (trainer/admin)
PUT    /api/sessions/:id                # Update session (trainer/admin)
DELETE /api/sessions/:id                # Delete session (trainer/admin)
GET    /api/sessions/trainer/my-sessions # Get trainer's sessions
```

### Bookings
```
POST   /api/bookings              # Create booking (member)
GET    /api/bookings/my-bookings  # Get user's bookings
PUT    /api/bookings/:id/cancel   # Cancel booking
GET    /api/bookings/session/:sessionId # Get session bookings (trainer/admin)
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Example Login Request

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "member@gym.com",
    "password": "member123"
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "member@gym.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "member"
  }
}
```

## 📊 Database Schema

### Users Table
- user_id (PK)
- email (unique)
- password (hashed)
- first_name, last_name
- phone
- role (member, trainer, admin)
- specialization (for trainers)
- bio (for trainers)
- profile_image

### Sessions Table
- session_id (PK)
- trainer_id (FK → users)
- activity_id (FK → activities)
- location_id (FK → locations)
- session_name
- session_date
- session_time
- duration (minutes)
- max_participants
- description

### Bookings Table
- booking_id (PK)
- session_id (FK → sessions)
- user_id (FK → users)
- status (confirmed, cancelled, completed)
- booking_date
- cancelled_at

## 🛠️ Testing API

### Using cURL

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get sessions (no auth required)
curl http://localhost:3000/api/sessions

# Get current user (requires token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the API endpoints
2. Set base URL: `http://localhost:3000/api`
3. For protected routes:
   - Go to Authorization tab
   - Type: Bearer Token
   - Token: Paste your JWT token

## 🔄 Next Steps

1. **Complete remaining controllers:**
   - blogController.js
   - activityController.js
   - locationController.js
   - userController.js

2. **Add validation middleware:**
   - Express-validator for input validation
   - Custom validators

3. **Implement features:**
   - Password reset functionality
   - File upload for profile images
   - Email notifications
   - Search and filtering

4. **Security enhancements:**
   - Rate limiting
   - Input sanitization
   - SQL injection prevention
   - CORS configuration

5. **Testing:**
   - Unit tests (Jest)
   - Integration tests
   - API documentation (Swagger)

## 🐛 Common Issues

### Database Connection Failed
- Check MySQL is running: `sudo service mysql status`
- Verify credentials in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `.env`
- Kill process using port 3000: `lsof -ti:3000 | xargs kill`

### Token Invalid
- Check JWT_SECRET matches between requests
- Token might be expired (default 7 days)
- Re-login to get new token

## 📚 Dependencies

- **express** - Web framework
- **mysql2** - MySQL client with promises
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing
- **express-validator** - Input validation

## 🔗 Integration with Frontend

Update frontend JavaScript to use API:

```javascript
// Example: Login function
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
}
```

## 📄 License

Proprietary - High Street Gym Management System
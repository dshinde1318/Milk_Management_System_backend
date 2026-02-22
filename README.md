# 🥛 Milk App Backend

A comprehensive NestJS backend for a milk supply management system with authentication, SMS/WhatsApp notifications, user roles, and real-time transaction tracking.

## 🎯 Features

- **User Authentication**: JWT-based authentication with role-based access control (admin, seller, buyer)
- **User Management**: Complete CRUD operations for users with password hashing
- **Milk Transactions**: Record and track daily milk deliveries between sellers and buyers
- **SMS/WhatsApp Notifications**: Integration with Twilio for instant notifications
- **Admin Panel**: AdminJS integration for database management (coming soon)
- **Analytics**: Seller and buyer statistics with date range filtering
- **Type Safety**: Full TypeScript support with strict mode
- **Database**: PostgreSQL with TypeORM ORM
- **Security**: Helmet, CORS, input validation, JWT tokens
- **Testing**: Jest setup for unit and e2e tests

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Docker & Docker Compose (optional, for PostgreSQL)
- npm or yarn

### Installation

1. **Clone and Install**
```bash
cd milk-app-backend
npm install
```

2. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Database**
```bash
docker-compose up -d postgres
```

4. **Seed Sample Data** (optional)
```bash
npm run seed
```

5. **Run Application**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── config/
│   └── database.config.ts           # TypeORM PostgreSQL configuration
├── modules/
│   ├── auth/
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts      # Passport JWT strategy
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts    # Route protection
│   │   ├── dto/
│   │   │   └── login.dto.ts         # Login & response validation
│   │   ├── auth.service.ts          # Authentication logic
│   │   ├── auth.controller.ts       # Auth endpoints
│   │   └── auth.module.ts           # Auth module config
│   │
│   ├── users/
│   │   ├── entities/
│   │   │   └── user.entity.ts       # User database schema
│   │   ├── dto/
│   │   │   └── create-user.dto.ts   # User validation
│   │   ├── users.service.ts         # User business logic
│   │   ├── users.controller.ts      # User endpoints
│   │   └── users.module.ts          # User module config
│   │
│   ├── milk-transactions/
│   │   ├── entities/
│   │   │   └── milk-transaction.entity.ts  # Transaction schema
│   │   ├── dto/
│   │   │   └── create-milk-transaction.dto.ts  # Validation
│   │   ├── milk-transactions.service.ts    # Transaction logic
│   │   ├── milk-transactions.controller.ts # Transaction endpoints
│   │   └── milk-transactions.module.ts     # Module config
│   │
│   └── notifications/
│       ├── notifications.service.ts # SMS/WhatsApp service
│       └── notifications.module.ts  # Module config
│
├── app.module.ts                   # Root module
├── app.controller.ts               # App controller
├── app.service.ts                  # App service
└── main.ts                         # Entry point

docker-compose.yml                 # PostgreSQL + Adminer
SETUP.md                          # Detailed setup guide
```

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with mobile & password |
| GET | `/auth/profile` | Get current user profile |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/register` | Register new user |
| GET | `/users/profile/:id` | Get user profile |
| GET | `/users` | List all users |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| PUT | `/users/:id/toggle-active` | Activate/deactivate |

### Milk Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/milk-transactions` | Record new delivery |
| GET | `/milk-transactions` | Query transactions |
| GET | `/milk-transactions/:id` | Get transaction details |
| PUT | `/milk-transactions/:id` | Update transaction |
| DELETE | `/milk-transactions/:id` | Delete transaction |
| GET | `/milk-transactions/seller/:sellerId/stats` | Seller statistics |
| GET | `/milk-transactions/buyer/:buyerId/stats` | Buyer statistics |

## 🔑 User Roles

### Admin
- Manage all users (sellers, buyers)
- View all transactions
- Access admin dashboard
- Generate reports

### Seller
- Register and manage buyers
- Record daily milk deliveries
- View buyer history and statistics
- Receive payment notifications

### Buyer
- View delivery history
- Track pending amounts
- Receive delivery notifications
- View seller information

## 📝 Example Requests

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "9876543210",
    "password": "seller123"
  }'
```

Response:
```json
{
  "id": "uuid",
  "name": "Raj Kumar",
  "mobile": "9876543210",
  "email": "raj@seller.com",
  "role": "seller",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7d"
}
```

### Create Transaction
```bash
curl -X POST http://localhost:3000/milk-transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer-uuid",
    "date": "2024-01-15",
    "quantity": 5,
    "unit": "L",
    "status": "delivered",
    "remarks": "Fresh milk from this morning",
    "pricePerUnit": 50
  }'
```

### Get Seller Statistics
```bash
curl -X GET "http://localhost:3000/milk-transactions/seller/seller-uuid/stats?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Configuration

### Environment Variables

Create `.env` file with:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=
DATABASE_PASSWORD=milk_password
DATABASE_NAME=milk_db

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=7d

# Server
NODE_ENV=development
PORT=3000

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# Admin Panel
ADMINJS_URI=/admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# API
API_URL=http://localhost:3000
```

## 🧪 Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run start:dev

# Build for production
npm run build

# Run production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Seed database with sample data
npm run seed

# Format code
npm run format

# Lint and fix
npm run lint
```

## 🗄️ Database Setup

### Using Docker (Recommended)
```bash
docker-compose up -d postgres

# Access Adminer at http://localhost:8080
# System: PostgreSQL
# Server: postgres
# Username: milk_db
# Password: milk_password
# Database: milk_db
```

### Using Local PostgreSQL
```bash
createdb milk_db
psql milk_db -U postgres
```

## 🔒 Security Features

- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **Input Validation**: class-validator DTOs
- ✅ **CORS Protection**: Configurable CORS headers
- ✅ **Helmet Security**: HTTP security headers
- ✅ **Environment Variables**: Sensitive config protection
- ✅ **Role-Based Access**: Admin, seller, buyer roles
- ✅ **Route Guards**: JWT authentication guards

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE user (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  role ENUM('admin', 'seller', 'buyer'),
  isActive BOOLEAN DEFAULT true,
  profileImage VARCHAR(255),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Milk Transactions Table
```sql
CREATE TABLE milk_transaction (
  id UUID PRIMARY KEY,
  sellerId UUID REFERENCES user(id),
  buyerId UUID REFERENCES user(id),
  date DATE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(5) DEFAULT 'L',
  status ENUM('pending', 'delivered', 'cancelled'),
  remarks TEXT,
  pricePerUnit DECIMAL(10,2),
  totalAmount DECIMAL(10,2),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  CONSTRAINT unique_delivery UNIQUE(sellerId, buyerId, date)
);
```

## 🚀 Deployment

### Prerequisites
- Server with Node.js 16+
- PostgreSQL database
- Twilio account (optional, for notifications)

### Deployment Steps

1. **Build Application**
```bash
npm run build
```

2. **Setup Environment**
```bash
cp .env.example .env
# Update with production values
```

3. **Run Migrations** (if needed)
```bash
npm run typeorm migration:run
```

4. **Start Server**
```bash
npm run start:prod
```

## 🤝 Integration with Mobile App

The React Native frontend communicates with this backend:

1. **Login**: POST /auth/login
2. **Get Profile**: GET /auth/profile (with JWT header)
3. **Create Transaction**: POST /milk-transactions
4. **Query Transactions**: GET /milk-transactions
5. **Get Statistics**: GET /milk-transactions/seller/:id/stats

**Mobile Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

## 📚 Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | ^10.3.3 | Framework |
| TypeScript | ^5.3.3 | Language |
| TypeORM | ^0.3.19 | ORM |
| PostgreSQL | 15 | Database |
| Passport | ^0.7.0 | Authentication |
| JWT | ^12.1.0 | Token management |
| Bcrypt | ^2.4.3 | Password hashing |
| Twilio | ^4.10.0 | SMS/WhatsApp |
| AdminJS | ^7.8.0 | Admin panel |
| Helmet | ^7.1.0 | Security |
| Jest | ^29.7.0 | Testing |

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Unable to connect to the database
```
**Solution**: Ensure PostgreSQL is running and credentials in .env are correct.

### JWT Token Invalid
```
Error: Invalid token
```
**Solution**: Make sure JWT token is in Authorization header: `Bearer YOUR_TOKEN`

### CORS Error
```
Error: Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Update CORS configuration in main.ts for your frontend URL.

## 📝 Notes

- Default port: 3000
- Default JWT expiration: 7 days
- Password minimum length: 6 characters
- Mobile number format: 10-15 characters

## 📄 License

This project is proprietary and confidential.

## 👨‍💻 Support

For issues, feature requests, or questions:
1. Check SETUP.md for detailed setup instructions
2. Review API documentation in this README
3. Check database logs with `docker logs milk-app-postgres`

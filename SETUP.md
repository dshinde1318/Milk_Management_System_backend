# Milk App Backend Setup

## 1. Prerequisites
- Node.js 18+
- npm
- Docker + Docker Compose (recommended for PostgreSQL)

## 2. Install dependencies
```bash
npm install
```

## 3. Configure environment
Create a `.env` file in the project root:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=milk_user
DATABASE_PASSWORD=milk_password
DATABASE_NAME=milk_db

# JWT
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRATION=7d

# Server
NODE_ENV=development
PORT=3000

# Optional Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=
```

## 4. Start database
```bash
docker-compose up -d postgres
```

Optional Adminer UI:
- URL: `http://localhost:8080`
- System: `PostgreSQL`
- Server: `postgres` (when inside docker network) or `localhost`
- Username: `milk_user`
- Password: `milk_password`
- Database: `milk_db`

## 5. Start application
```bash
npm run start:dev
```

## 6. Useful commands
```bash
npm run build
npm run lint
npm test
npm run test:cov
```

## 7. API quick checks
1. Health: `GET http://localhost:3000/`
2. Register: `POST http://localhost:3000/users/register`
3. Login: `POST http://localhost:3000/auth/login`
4. Profile: `GET http://localhost:3000/auth/profile` with bearer token

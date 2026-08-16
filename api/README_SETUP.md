# Real Estate App - Quick Setup (Backend + DB + Seeding)

This repo includes a MySQL-backed Prisma API and a React (Vite) frontend.

## 1) Create environment file for backend
Copy example env:

- `api/.env.example` -> `api/.env`

At minimum set:
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `WHATSAPP_BUSINESS_NUMBER` (optional; seed/login will still run with default)

Example:
```env
DATABASE_URL="mysql://root:root@localhost:3306/realestate?schema=public"
JWT_SECRET_KEY="change-this-dev-secret"
WHATSAPP_BUSINESS_NUMBER="919876543210"
CLIENT_URL="http://localhost:5173"
```

## 2) Run Prisma migrations
From `api/`:

```bash
npx prisma migrate dev
```

If you only want to create tables without migrations:

```bash
npx prisma db push
```

## 3) Seed dummy data
From `api/`:

```bash
npm run seed
```

It will create:
- admins + users
- hero banners, partners
- many properties (Odisha cities)
- bookings, chats, messages

## 4) Run backend server
From `api/`:

```bash
npm run dev
```

Server starts on:
- `http://localhost:8800`
- API under `/api`

## 5) Run frontend
From `client/`:

```bash
npm run dev
```

Frontend uses:
- `http://localhost:8800/api`

## Test accounts (from seed output)
- Admin: `soumya050794@gmail.com` / `password123`
- Admin: `manager@odishaland.com` / `password123`
- Admin: `support@odishaland.com` / `password123`

## Notes
If you see Prisma errors like “Can't reach database server at localhost:3306”,
start your MySQL server and confirm your `DATABASE_URL`.


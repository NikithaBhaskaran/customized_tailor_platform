# Costume Customization Platform Starter

Production-ready Next.js starter with:

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL

## 1) Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Update `DATABASE_URL` in `.env` with your PostgreSQL connection string.

4. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 2) Folder Structure (Beginner-Friendly)

```txt
.
├── prisma/
│   └── schema.prisma
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── costumes/route.ts
│   │   │   ├── health/route.ts
│   │   │   └── auth/
│   │   │       ├── [...nextauth]/route.ts
│   │   │       └── register/route.ts
│   │   ├── customer/dashboard/page.tsx
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── page.tsx
│   │   ├── register/page.tsx
│   │   └── tailor/dashboard/page.tsx
│   ├── components/
│   │   └── layout/page-container.tsx
│   ├── features/
│   │   └── costumes/costume.service.ts
│   ├── lib/
│   │   └── prisma.ts
│   ├── middleware.ts
│   └── types/
│       ├── api.ts
│       └── next-auth.d.ts
├── .env
├── .env.example
└── package.json
```

### What each folder does

- `src/app`: UI routes and backend API routes (App Router).
- `src/app/api`: Server-side route handlers (your backend endpoints).
- `src/components`: Reusable UI components.
- `src/features`: Business logic grouped by domain (scales better than dumping everything in one place).
- `src/lib`: Shared utilities and integrations (e.g. Prisma client singleton).
- `src/types`: Shared TypeScript types.
- `prisma`: Database schema and migration files.
- `public`: Static assets (images/icons).

## 3) Environment Variables

Use `.env.example` as your template:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/costume_customization?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"
AUTH_SECRET="change-this-to-a-long-random-string"
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_test_secret"
```

- `DATABASE_URL`: used by Prisma to connect to PostgreSQL.
- `NEXT_PUBLIC_APP_URL`: optional public URL (available in browser code).
- `AUTH_URL`: base URL used by NextAuth.
- `AUTH_SECRET`: secret used to sign/encrypt auth tokens.
- `RAZORPAY_KEY_ID`: Razorpay public key (test/live).
- `RAZORPAY_KEY_SECRET`: Razorpay secret key (server-only).

## 4) API Routes Included

- `GET /api/health`
  - Health check endpoint.
- `GET /api/costumes`
  - Returns all costumes from PostgreSQL.
- `POST /api/costumes`
  - Creates a costume.
  - JSON body example:

```json
{
  "name": "Steampunk Explorer",
  "category": "Sci-Fi",
  "description": "Goggles, leather coat, brass accessories"
}
```

## 5) Auth Routes Included

- `POST /api/auth/register`
  - Registers users with hashed passwords.
- `/api/auth/*`
  - NextAuth built-in endpoints (credentials login, session, signout).
- `/customer/dashboard`
  - Accessible only to users with role `CUSTOMER`.
- `/tailor/dashboard`
  - Accessible only to users with role `TAILOR`.

## 6) Production Notes

- Keep secrets only in `.env` (never commit `.env`).
- Add request validation and auth before exposing write endpoints publicly.
- Use managed PostgreSQL + connection pooling for production.
- Add logging, monitoring, and tests as the project grows.

# EcoSpark Hub — Backend API

A RESTful API for the EcoSpark Hub sustainability community portal.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT + bcryptjs
- **Payment**: Stripe
- **Image Upload**: Cloudinary + Multer
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL database
- Stripe account
- Cloudinary account

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd ecospark-backend

# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Fill in your environment variables

# Run migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=5000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=
STRIPE_CANCEL_URL=
```

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Auth |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/users | Admin |
| GET | /api/users/:id | Admin |
| PATCH | /api/users/:id/status | Admin |
| PATCH | /api/users/:id/role | Admin |
| GET | /api/users/profile/me | Auth |
| PATCH | /api/users/profile/me | Auth |
| DELETE | /api/users/profile/me | Auth |

### Categories
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/categories | Public |
| GET | /api/categories/:id | Public |
| POST | /api/categories | Admin |
| PATCH | /api/categories/:id | Admin |
| DELETE | /api/categories/:id | Admin |

### Ideas
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/ideas | Public |
| GET | /api/ideas/top-voted | Public |
| GET | /api/ideas/:id | Public/Paid |
| POST | /api/ideas | Member |
| GET | /api/ideas/my | Member |
| PATCH | /api/ideas/:id | Member |
| PATCH | /api/ideas/:id/submit | Member |
| DELETE | /api/ideas/:id | Member |
| GET | /api/ideas/admin/all | Admin |
| PATCH | /api/ideas/:id/approve | Admin |
| PATCH | /api/ideas/:id/reject | Admin |
| DELETE | /api/ideas/admin/:id | Admin |

### Votes
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/votes | Member |
| DELETE | /api/votes/:ideaId | Member |
| GET | /api/votes/my | Member |
| GET | /api/votes/:ideaId/stats | Public |

### Comments
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/comments | Member |
| GET | /api/comments/idea/:ideaId | Public |
| GET | /api/comments/my | Member |
| PATCH | /api/comments/:id | Member |
| DELETE | /api/comments/:id | Member/Admin |
| GET | /api/comments/admin/all | Admin |

### Payments
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/payments/initiate | Member |
| POST | /api/payments/webhook | Stripe |
| GET | /api/payments/verify/:sessionId | Member |
| GET | /api/payments/my | Member |
| GET | /api/payments/access/:ideaId | Member |
| GET | /api/payments/admin/all | Admin |

### Newsletter
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/newsletter/subscribe | Public |
| POST | /api/newsletter/unsubscribe | Public |
| GET | /api/newsletter/admin/all | Admin |
| DELETE | /api/newsletter/admin/:id | Admin |

## Admin Credentials (Seed)

```
Email    : admin@ecospark.com
Password : admin123456
```

## Test Member Credentials (Seed)

```
Email    : member@ecospark.com
Password : member123456
```

## Stripe Test Cards

```
Success : 4242 4242 4242 4242
Decline : 4000 0000 0000 0002
Expiry  : Any future date
CVC     : Any 3 digits
```
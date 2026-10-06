# 🌾 AgriConnect – Smart Farming Marketplace

A full-stack MERN marketplace where **Farmers** list produce, an **Admin** approves and manages everything, and **Clients** buy, track and review.

**Stack:** React 18 (Vite) · Tailwind CSS · React Router · Recharts · Node.js · Express · MongoDB + Mongoose · JWT · bcrypt · Zod · Cloudinary

```
Farmer → adds products → Admin approves → Client orders → Farmer accepts/ships → Client receives & reviews
```

---

## 1. Quick start

**Prerequisites:** Node 18+, a MongoDB instance (local or Atlas), and (for uploading product images) a free Cloudinary account.

```bash
# 1) install everything
npm run install:all

# 2) configure the backend
cd backend
cp .env.example .env        # then edit MONGODB_URI, JWT_SECRET, CLOUDINARY_*
cd ..

# 3) (optional) frontend env – defaults work for local development
cp frontend/.env.example frontend/.env

# 4) load demo data (wipes the database first!)
npm run seed

# 5) run both servers (two terminals)
npm run dev:backend         # http://localhost:5000
npm run dev:frontend        # http://localhost:5173
```

Health check: `GET http://localhost:5000/api/health`

---

## 2. Demo credentials

Created by `npm run seed`. Passwords come from `SEED_*_PASSWORD` in `backend/.env` (defaults shown).

| Role   | Email                      | Password     |
|--------|----------------------------|--------------|
| Admin  | `admin@agriconnect.com`    | `Admin@123`  |
| Farmer | `farmer1@agriconnect.com` … `farmer5@agriconnect.com`  | `Farmer@123` |
| Client | `client1@agriconnect.com` … `client10@agriconnect.com` | `Client@123` |

> These are **demo-only** credentials. Change them in `.env` before seeding anything shared, and never seed a production database (the script refuses when `NODE_ENV=production` unless `ALLOW_SEED=true`).

**Demo data:** 5 farmers · 10 clients · 20 products (including Pending, Rejected and Out-of-Stock examples) · 9 categories · 15 orders in every status · reviews · notifications · complaints · payments.

---

## 3. Environment variables

`backend/.env`

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | | Token lifetime (default `7d`) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | for uploads | Product image storage |
| `CLIENT_URL` | | Frontend origin for CORS + reset links (default `http://localhost:5173`) |
| `PLATFORM_FEE_PERCENT` | | Commission used for farmer earnings (default `5`) |
| `SEED_ADMIN_PASSWORD`, `SEED_FARMER_PASSWORD`, `SEED_CLIENT_PASSWORD` | for seeding | Demo account passwords |

`frontend/.env` (all optional): `VITE_API_URL` (API origin in production) and `VITE_DEMO_*` (login-page quick-fill buttons).

No secrets are hard-coded anywhere; the server exits at start-up if `MONGODB_URI` or `JWT_SECRET` is missing.

---

## 4. Features

**Public:** Home (hero, search, categories, featured products/farmers, how it works, reviews, CTA) · About · Products (search, category/location/price filters, sorting, pagination) · Product details · Farmers · Farmer profile · Contact · Login · Register · Forgot/Reset password

**Farmer:** profile · add/edit/delete products with multi-image upload (Cloudinary) · accept/reject orders and move them Processing → Shipped → Delivered · sales history · earnings (after commission) · reviews · notifications · charts

**Client:** browse · cart with quantity control · checkout (saved/new address, payment method) · order list · cancel while Pending · order tracking timeline · wishlist · ratings & reviews after delivery · notifications · profile & addresses

**Admin:** KPI dashboard + 5 charts + recent registrations/orders + system activity · approve/reject/block/edit farmers · block/unblock clients · approve/reject/delete products · category CRUD · all orders (status override) · payments · remove reviews · complaints with responses · send notifications (all / farmers / clients / one user) · reports with date range and CSV export

### Order workflow
`Pending → Accepted → Processing → Shipped → Delivered → Review` (or `Rejected` / `Cancelled`).
Transitions and who may perform them are enforced on the server. Rejecting or cancelling restores stock and refunds paid orders. A cart containing products from several farmers is split into one order per farmer.

---

## 5. Security

- Passwords hashed with bcrypt (`bcryptjs`, cost 12); never returned by the API.
- JWT in an httpOnly cookie (and `Authorization: Bearer` fallback).
- The user's **role and status are re-read from the database on every request**; they are never trusted from the token or request body.
- Role middleware on every protected route (`/api/admin/*` admin-only; farmer-only and client-only routes). Changing a URL in the browser can't expose another role's data – the API returns 403/404 and the UI redirects.
- Ownership checks: farmers touch only their own products/orders, clients only their own cart/orders/reviews.
- Blocked or unapproved accounts cannot log in.
- Zod validation on every write; central error handler; Helmet; CORS allow-list; rate limiting on `/api/auth`.
- Image upload: JPG/PNG/WEBP only, 5 MB each, max 5 per product; images are deleted from Cloudinary when a product (or image) is deleted.
- Forgot-password uses a hashed, expiring token and a response that doesn't reveal whether an email exists.

---

## 6. API overview (all prefixed with `/api`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/forgot-password` · `POST /auth/reset-password/:token` |
| Products | `GET /products` · `GET /products/:id` · `POST /products` · `PUT /products/:id` · `DELETE /products/:id` · `GET /products/mine` · `GET /products/:id/reviews` · `GET /categories` |
| Orders | `POST /orders` · `GET /orders` · `GET /orders/:id` · `PUT /orders/:id/status` · `DELETE /orders/:id` (admin) · `GET /orders/summary` |
| Farmers | `GET /farmers` · `GET /farmers/:id` · `PUT /farmers/:id` · `GET /farmers/me/dashboard` · `GET /farmers/me/earnings` |
| Client | `GET/POST/PUT/DELETE /cart…` · `GET /wishlist` · `POST /wishlist/:productId` · `POST /reviews` · `GET /reviews/mine` |
| Account | `GET/PUT /profile` · `PUT /profile/password` · `POST/DELETE /profile/addresses` · `GET/PUT/DELETE /notifications…` · `POST /complaints` |
| Admin | `GET /admin/dashboard` · `/farmers` · `/clients` · `/products` · `/orders` · `/payments` · `/reviews` · `/complaints` · `/reports` · `/activity` · category CRUD · `PUT …/status` · `POST /admin/notifications` |

List endpoints return `{ success, data, pagination }`; single resources return `{ success, data }`; errors return `{ success: false, message, errors? }`.

---

## 7. Project structure

```
AgriConnect/
├── backend/
│   ├── config/        db + cloudinary
│   ├── controllers/   auth, product, order, cart, wishlist, review, farmer, admin, …
│   ├── middleware/    auth (protect/authorize), validate (zod), upload (multer), error
│   ├── models/        User, Farmer, Client, Product, Category, Order, Payment,
│   │                  Review, Notification, Complaint, Cart, Wishlist
│   ├── routes/        authRoutes + index (all other routes)
│   ├── services/      imageService (Cloudinary upload/delete)
│   ├── utils/         helpers, stats (monthly series), notify, constants
│   ├── seed/seed.js   demo data
│   └── server.js
└── frontend/
    └── src/
        ├── components/  reusable UI (cards, modal, charts, tables helpers, uploader…)
        ├── pages/       public pages + farmer/ client/ admin/
        ├── layouts/     PublicLayout, DashboardLayout (+ sidebar config)
        ├── context/     AuthContext, CartContext
        ├── hooks/       useFetch, useDebounce
        ├── services/    axios instance
        └── utils/       formatting, constants, csv
```

---

## 8. Notes & assumptions

- **Currency** is ₹ (change `CURRENCY` in `frontend/src/utils/format.js` and the `₹` in a few backend notification messages).
- **Payments are simulated:** "Cash on Delivery" and "Online (demo)". No real gateway is integrated.
- **Commission:** farmer earnings = sales × (1 − `PLATFORM_FEE_PERCENT`%).
- **Forgot password:** no email provider is configured; in development the reset link is printed in the backend console. Plug Nodemailer/SendGrid into `authController.forgotPassword` for production.
- **Seed images** are loaded from loremflickr.com (needs internet); the UI shows a friendly placeholder if an image can't load. New products use Cloudinary.
- Admin accounts are never self-registered – create them via the seed script or directly in the database.
- Mongo transactions aren't required: stock is reserved with atomic conditional updates and rolled back on failure.

## 9. Deployment tips

Backend: any Node host (Render, Railway, Fly) + MongoDB Atlas; set all env vars, `NODE_ENV=production`, and `CLIENT_URL` to your frontend origin.
Frontend: `npm run build` → deploy `frontend/dist` (Vercel/Netlify) with `VITE_API_URL` pointing at the API. Add a rewrite of all routes to `index.html` for client-side routing.

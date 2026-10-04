# 🛍️ Forever

### Full-Stack MERN E-Commerce Platform

A modern full-stack e-commerce application with a customer storefront, admin dashboard, secure authentication, Stripe payments, order tracking, Cloudinary image management, and newsletter campaigns.

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

[Storefront](https://forever-frontend-ae4yjxczz-muaddhalsways-projects.vercel.app) ·
[Admin Panel](https://admin-iota-six-18.vercel.app) ·
[Backend API](https://forever-mu-orcin.vercel.app)

---

## ✨ Overview

**Forever** is a MERN e-commerce platform built as three connected applications:

- **Customer Storefront** — browse, search, purchase, and track products.
- **Admin Dashboard** — manage products, orders, subscribers, and campaigns.
- **REST API** — authentication, business logic, database access, payments, images, and email delivery.

---

## 🚀 Features

### Customer Store

- User registration and login
- JWT authentication and authorization
- Product catalog
- Product search and filtering
- Product details
- Shopping cart
- Address management
- Cash on Delivery
- Stripe checkout
- Order history and tracking
- Newsletter subscription
- Responsive interface
- Toast notifications

### Admin Dashboard

- Secure admin login
- Add and remove products
- Upload product images
- Manage customer orders
- Update order status
- Manage newsletter subscribers
- Create email campaigns
- Send campaign emails

### Integrations

- **Stripe** — online payments
- **Cloudinary** — image storage and optimization
- **Resend** — transactional and campaign emails
- **MongoDB** — application database
- **Vercel** — application deployment

---

## 🛠️ Tech Stack

### Frontend

[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)](https://axios-http.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

- React
- Vite
- React Router
- Axios
- React Toastify
- Tailwind CSS

### Backend

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Token
- bcrypt
- Validator
- CORS
- dotenv

### Services

[![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Resend](https://img.shields.io/badge/Resend-000000?style=flat-square&logo=resend&logoColor=white)](https://resend.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 🧱 Architecture

```text
Customer Store ─────┐
                    │
Admin Dashboard ────┼──► Express REST API ───► MongoDB
                    │           │
                    │           ├──► Cloudinary
                    │           ├──► Stripe
                    │           └──► Resend
                    │
                    └── Axios / HTTP
```

---

## 📁 Project Structure

```text
forever/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
│
├── admin/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
│
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- npm
- MongoDB instance
- Stripe account
- Cloudinary account
- Resend account

### Clone the Repository

```bash
git clone <repo-url>
cd <repository-name>
```

### Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../admin
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file inside `backend/`:

```env
MONGODB_URL=
JWT_SECRET=

ADMIN_EMAIL=
ADMIN_PASSWORD=

STRIPE_SECRET_KEY=

FRONTEND_URL=
ADMIN_URL=

RESEND_API_KEY=
RESEND_FROM=
NEWSLETTER_UNSUBSCRIBE_BASE_URL=
```

Create `frontend/.env`:

```env
VITE_BACKEND_URL=
```

Create `admin/.env`:

```env
VITE_BACKEND_URL=
```

> [!IMPORTANT]
> Never commit `.env` files, passwords, database credentials, or API keys to GitHub.

---

## 💻 Development

### Backend

```bash
cd backend
npm run server
```

### Storefront

```bash
cd frontend
npm run dev
```

### Admin

```bash
cd admin
npm run dev
```

---

## 📦 Production Build

### Frontend

```bash
cd frontend
npm run build
```

### Admin

```bash
cd admin
npm run build
```

---

## ☁️ Deployment

| Application | Platform | Status |
| --- | --- | --- |
| Customer Storefront | Vercel | Live |
| Admin Dashboard | Vercel | Live |
| Backend API | Vercel | Live |
| Database | MongoDB | Connected |
| Images | Cloudinary | Integrated |
| Payments | Stripe | Integrated |
| Email | Resend | Integrated |

### Live Applications

- **Storefront:** https://forever-frontend-ae4yjxczz-muaddhalsways-projects.vercel.app
- **Admin:** https://admin-iota-six-18.vercel.app
- **Backend API:** https://forever-mu-orcin.vercel.app

---

## 🔒 Security

- Password hashing with bcrypt
- JWT-based authentication
- Protected admin operations
- Input validation
- CORS configuration
- Environment-based secrets
- Stripe-managed payments
- Secure newsletter unsubscribe flow

---

## 🗺️ Roadmap

- [x] Authentication
- [x] Product catalog
- [x] Search and filtering
- [x] Shopping cart
- [x] Address management
- [x] Cash on Delivery
- [x] Stripe checkout
- [x] Order tracking
- [x] Admin dashboard
- [x] Cloudinary image management
- [x] Newsletter subscriptions
- [x] Email campaigns


---

## 📄 License

This project is licensed under the **ISC License**.

---

### Built with MERN ⚡

**React · Node.js · Express · MongoDB**

Stripe · Cloudinary · Resend · Vercel

**2026**

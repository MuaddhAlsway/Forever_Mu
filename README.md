# 🛍️ Forever E-Commerce

A full-stack MERN e-commerce platform with a customer storefront, admin dashboard, secure payments, order tracking, and newsletter campaign management.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## 🔗 Live Links

- **Storefront:** [Forever Store](https://forever-frontend-ae4yjxczz-muaddhalsways-projects.vercel.app)
- **Admin Panel:** [Forever Admin](https://admin-iota-six-18.vercel.app)
- **Backend API:** [Forever API](https://forever-mu-orcin.vercel.app)

## ✨ Overview

Forever is a modern e-commerce application built with the MERN stack. It features a responsive customer storefront, a secure admin panel for product/order management, Stripe checkout with COD fallback, newsletter subscriptions with HMAC unsubscribe links, and campaign delivery tracking.

## 🚀 Features

### Customer Store
- User registration and authentication (JWT)
- Product browsing, search, and collection pages
- Product detail pages with size selection
- Shopping cart management
- Address book management
- Checkout with Cash on Delivery (COD) and Stripe
- Order history and order tracking
- Profile management and password change
- Newsletter subscription

### Admin Dashboard
- Secure admin authentication
- Product management (add, list, edit, delete)
- Order management and status updates
- Newsletter subscriber management
- Campaign composer with delivery history and transport status

### Backend API
- RESTful API with Express
- MongoDB with Mongoose ODM
- JWT-based authentication
- Role-based admin access
- Input validation and sanitization
- CORS with allowlist
- Centralized error handling

### Newsletter & Campaigns
- Subscriber management (subscribe/unsubscribe)
- HMAC-SHA256 unsubscribe tokens with versioning
- Bounded campaign delivery (batching/concurrency)
- Per-recipient delivery records
- Transport abstraction (Resend)

### Payments
- Stripe Checkout Sessions
- Webhook signature verification with raw body parsing
- Payment status tracking
- COD support

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

## 📁 Project Structure

`
ecommerance-app/
├── admin/          # Admin dashboard (React + Vite)
├── frontend/       # Customer storefront (React + Vite)
├── backend/        # API server (Express + MongoDB)
├── assets/         # Documentation assets
└── README.md
`

## ⚡ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB instance (local or Atlas)
- Stripe account
- Cloudinary account
- Resend account

### Installation
`ash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install admin dependencies
cd ../admin && npm install
`

### Environment Variables

#### Backend (ackend/.env)
`env
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
NEWSLETTER_CAMPAIGN_MAX_RECIPIENTS=2000
NEWSLETTER_UNSUBSCRIBE_SECRET=
`

#### Frontend (rontend/.env)
`env
VITE_BACKEND_URL=
`

#### Admin (dmin/.env)
`env
VITE_BACKEND_URL=
`

### Development
`ash
# Backend
cd backend && npm run server

# Frontend
cd frontend && npm run dev

# Admin
cd admin && npm run dev
`

### Production Build
`ash
# Frontend
cd frontend && npm run build

# Admin
cd admin && npm run build
`

## ☁️ Deployment

Deployed on [Vercel](https://vercel.com/). Set environment variables in each Vercel project. Note: VITE_* variables are embedded at build time, so frontend/admin require fresh builds after changes.

## 🔒 Security

- JWT authentication with secure verification
- Admin routes protected with custom auth middleware
- Stripe webhook signature verification with raw body
- HMAC unsubscribe tokens (no secrets stored in DB)
- CORS restricted to allowlisted origins
- Input sanitization and validation
- No secrets exposed in client code

## 📄 License

This project is licensed under the ISC License.

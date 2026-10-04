# 🛍️ Forever

### Full-Stack MERN E-Commerce Platform

A modern full-stack e-commerce application with a customer storefront, admin dashboard, secure authentication, Stripe payments, order tracking, Cloudinary image management, and newsletter campaigns.

[![Forever E-Commerce Portfolio Showcase](./HomePageReadme/2026%20E-Commerce%20Portfolio%20Showcase.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/HomePageReadme/2026%20E-Commerce%20Portfolio%20Showcase.png)

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

[**Storefront**](https://forever-frontend-alpha-mauve.vercel.app/) · [**Admin Panel**](https://admin-iota-six-18.vercel.app) · [**Backend API**](https://forever-mu-lz6g.vercel.app)

---

## ✨ Overview

**Forever** is a MERN e-commerce platform composed of three connected applications:

- **Customer Storefront** — browse, search, purchase, and track products.
- **Admin Dashboard** — manage products, orders, newsletter subscribers, and campaigns.
- **REST API** — handles authentication, business logic, database access, payments, images, and email delivery.

---

## 🚀 Features

### 🛍️ Customer Store

- User registration and login
- JWT authentication and authorization
- Product catalog and product details
- Product search and filtering
- Shopping cart management
- Address management
- Cash on Delivery
- Stripe checkout
- Order history and tracking
- Newsletter subscription
- Responsive interface
- Toast notifications

### ⚙️ Admin Dashboard

- Secure admin login
- Add and remove products
- Upload product images
- Manage customer orders
- Update order status
- Manage newsletter subscribers
- Create email campaigns
- Send campaign emails

### 🔌 Integrations

- **Stripe** — online payment processing
- **Cloudinary** — product image storage and optimization
- **Resend** — transactional and campaign email delivery
- **MongoDB** — application database
- **Vercel** — frontend, admin, and backend deployment

---

## 🛠️ Tech Stack

| Frontend | Backend | Database | Auth | Services |
| --- | --- | --- | --- | --- |
| ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) | ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | ![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white) |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | ![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white) | ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white) | ![bcrypt](https://img.shields.io/badge/bcrypt-Password_Hashing-003A70?style=flat-square) | ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white) |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white) | ![Validator](https://img.shields.io/badge/Validator-Input_Validation-2B2B2B?style=flat-square) | — | — | ![Resend](https://img.shields.io/badge/Resend-000000?style=flat-square&logo=resend&logoColor=white) |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) | ![CORS](https://img.shields.io/badge/CORS-Enabled-000000?style=flat-square) | — | — | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white) |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | ![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=flat-square&logo=dotenv&logoColor=black) | — | — | — |
| ![React Toastify](https://img.shields.io/badge/React_Toastify-07BC0C?style=flat-square&logo=react&logoColor=white) | — | — | — | — |

### Stack Overview

| Layer | Technologies |
| --- | --- |
| **Storefront** | React, Vite, React Router, Axios, React Toastify, Tailwind CSS |
| **Admin Panel** | React, Vite, React Router, Axios, React Toastify, Tailwind CSS |
| **Backend API** | Node.js, Express, Mongoose, Validator, CORS, dotenv |
| **Database** | MongoDB |
| **Authentication** | JWT, bcrypt |
| **Payments** | Stripe |
| **Media** | Cloudinary |
| **Email** | Resend |
| **Deployment** | Vercel |

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

## 📸 Screenshots

### 🏠 Storefront

#### Home

[![Forever Home 01](./screenshot/Home01.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/Home01.png)

[![Forever Home 02](./screenshot/Home02.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/Home02.png)

#### Best Seller

[![Forever Best Seller](./screenshot/BestSeller.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/BestSeller.png)

#### Collection

[![Forever Collection](./screenshot/Collection.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/Collection.png)

#### Cart

[![Forever Cart](./screenshot/Cart.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/Cart.png)

#### Payment

[![Forever Payment](./screenshot/Payment.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/Payment.png)

#### My Orders

[![Forever My Orders](./screenshot/MyOrder.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/MyOrder.png)

#### Track Order

[![Forever Track Order](./screenshot/TrackOurOrder.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/TrackOurOrder.png)

#### About Us

[![Forever About Us](./screenshot/aboutus.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/aboutus.png)

#### Contact Us

[![Forever Contact Us](./screenshot/ContactUS.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/ContactUS.png)

#### Policy & Newsletter Subscription

[![Forever Policy and Subscribe](./screenshot/Policy%26Subscirbe.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/Policy%26Subscirbe.png)

### ⚙️ Admin Dashboard

#### Admin Overview

[![Forever Admin 01](./screenshot/admin01.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/admin01.png)

#### Product Management

[![Forever Admin 02](./screenshot/admin02.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/admin02.png)

#### Order Management

[![Forever Admin 03](./screenshot/admin03.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/admin03.png)

#### Admin Management

[![Forever Admin 04](./screenshot/admin04.png)](https://github.com/MuaddhAlsway/Forever_Mu/blob/main/screenshot/admin04.png)

---

## 📁 Project Structure

```text
Forever_Mu/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── admin/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── HomePageReadme/
├── screenshot/
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
git clone https://github.com/MuaddhAlsway/Forever_Mu.git
cd Forever_Mu
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

Create `backend/.env`:

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
> Never commit `.env` files, passwords, database credentials, API keys, or other secrets to GitHub.

---

## 💻 Development

Run each application in a separate terminal.

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
| Customer Storefront | Vercel | 🟢 Live |
| Admin Dashboard | Vercel | 🟢 Live |
| Backend API | Vercel | 🟢 Live |
| Database | MongoDB | 🟢 Connected |
| Images | Cloudinary | 🟢 Integrated |
| Payments | Stripe | 🟢 Integrated |
| Email | Resend | 🟢 Integrated |

### Live Applications

- **Storefront:** https://forever-frontend-alpha-mauve.vercel.app/
- **Admin:** https://admin-iota-six-18.vercel.app
- **Backend API:** https://forever-mu-lz6g.vercel.app

---

## 🔒 Security

- Password hashing with bcrypt
- JWT-based authentication and authorization
- Protected admin operations
- Input validation
- CORS configuration
- Environment-based secrets
- Stripe-managed payment processing
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


**© 2026 Muaddh Alsway**

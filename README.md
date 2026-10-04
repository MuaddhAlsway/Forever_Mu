<<<<<<< HEAD
ï»¿# ðŸ›ï¸ Forever E-Commerce

A full-stack MERN e-commerce platform with a customer storefront, admin dashboard, secure payments, order tracking, and newsletter campaign management.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## ðŸ”— Live Links

- **Storefront:** [Forever Store](https://forever-frontend-alpha-mauve.vercel.app)
- **Admin Panel:** [Forever Admin](https://admin-iota-six-18.vercel.app)
- **Backend API:** [Forever API](https://forever-mu-orcin.vercel.app)

## âœ¨ Overview

Forever is a modern e-commerce application built with the MERN stack. It features a responsive customer storefront, a secure admin panel for product/order management, Stripe checkout with COD fallback, newsletter subscriptions with HMAC unsubscribe links, and campaign delivery tracking.

## ðŸš€ Features

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

## ðŸ› ï¸ Tech Stack

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

## ðŸ“ Project Structure

`
ecommerance-app/
â”œâ”€â”€ admin/          # Admin dashboard (React + Vite)
â”œâ”€â”€ frontend/       # Customer storefront (React + Vite)
â”œâ”€â”€ backend/        # API server (Express + MongoDB)
â”œâ”€â”€ assets/         # Documentation assets
â””â”€â”€ README.md
`
=======
# ðŸ›ï¸ Forever

### Full-Stack MERN E-Commerce Platform

A modern full-stack e-commerce application with a customer storefront, admin dashboard, secure authentication, Stripe payments, order tracking, Cloudinary image management, and newsletter campaigns.

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<<<<<<< HEAD
[Storefront](https://forever-frontend-alpha-mauve.vercel.app) Â·
[Admin Panel](https://admin-iota-six-18.vercel.app) Â·
[Backend API](https://forever-mu-orcin.vercel.app)
=======
[**Storefront**](https://forever-frontend-alpha-mauve.vercel.app/) ·
[**Admin Panel**](https://admin-iota-six-18.vercel.app) ·
[**Backend API**](https://forever-mu-orcin.vercel.app)
>>>>>>> b2850247ca1a2d091c4281f91470bacb96f539ed

---

## âœ¨ Overview

**Forever** is a MERN e-commerce platform composed of three connected applications:

<<<<<<< HEAD
- **Customer Storefront** â€” browse, search, purchase, and track products.
- **Admin Dashboard** â€” manage products, orders, subscribers, and campaigns.
- **REST API** â€” authentication, business logic, database access, payments, images, and email delivery.
=======
- **Customer Storefront** — browse, search, purchase, and track products.
- **Admin Dashboard** — manage products, orders, newsletter subscribers, and campaigns.
- **REST API** — handles authentication, business logic, database access, payments, images, and email delivery.

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
>>>>>>> b2850247ca1a2d091c4281f91470bacb96f539ed

---

## ðŸš€ Features

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

<<<<<<< HEAD
- **Stripe** â€” online payments
- **Cloudinary** â€” image storage and optimization
- **Resend** â€” transactional and campaign emails
- **MongoDB** â€” application database
- **Vercel** â€” application deployment
=======
- **Stripe** — online payment processing
- **Cloudinary** — product image storage and optimization
- **Resend** — transactional and campaign email delivery
- **MongoDB** — application database
- **Vercel** — frontend, admin, and backend deployment
>>>>>>> b2850247ca1a2d091c4281f91470bacb96f539ed

---

## ðŸ› ï¸ Tech Stack

| **Frontend** | **Backend** | **Database** | **Authentication** | **Services & Deployment** |
| :---: | :---: | :---: | :---: | :---: |
| ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white) | ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) | ![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white) |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) | ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white) | ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white) | ![bcrypt](https://img.shields.io/badge/bcrypt-003A70?style=for-the-badge) | ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white) |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white) | ![Validator](https://img.shields.io/badge/Validator-2B2B2B?style=for-the-badge) |  |  | ![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white) |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white) | ![CORS](https://img.shields.io/badge/CORS-000000?style=for-the-badge) |  |  | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) | ![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black) |  |  |  |
| ![React Toastify](https://img.shields.io/badge/React_Toastify-07BC0C?style=for-the-badge&logo=react&logoColor=white) |  |  |  |  |

### Stack Overview

- **Frontend:** React, Vite, React Router, Axios, React Toastify, Tailwind CSS
- **Admin Panel:** React, Vite, React Router, Axios, React Toastify, Tailwind CSS
- **Backend:** Node.js, Express, Mongoose, Validator, CORS, dotenv
- **Database:** MongoDB
- **Authentication:** JWT + bcrypt
- **Payments:** Stripe
- **Media:** Cloudinary
- **Email:** Resend
- **Deployment:** Vercel

---

## ðŸ§± Architecture

```text
Customer Store â”€â”€â”€â”€â”€â”
                    â”‚
Admin Dashboard â”€â”€â”€â”€â”¼â”€â”€â–º Express REST API â”€â”€â”€â–º MongoDB
                    â”‚           â”‚
                    â”‚           â”œâ”€â”€â–º Cloudinary
                    â”‚           â”œâ”€â”€â–º Stripe
                    â”‚           â””â”€â”€â–º Resend
                    â”‚
                    â””â”€â”€ Axios / HTTP
```

---

## ðŸ“ Project Structure

```text
forever/
<<<<<<< HEAD
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ assets/
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ context/
â”‚   â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â””â”€â”€ App.jsx
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ admin/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ assets/
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â””â”€â”€ App.jsx
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ config/
â”‚   â”œâ”€â”€ controllers/
â”‚   â”œâ”€â”€ middleware/
â”‚   â”œâ”€â”€ models/
â”‚   â”œâ”€â”€ routes/
â”‚   â””â”€â”€ server.js
â”‚
â””â”€â”€ README.md
=======
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
├── screenshot/
│   ├── Home01.png
│   ├── Home02.png
│   ├── BestSeller.png
│   ├── Collection.png
│   ├── Cart.png
│   ├── Payment.png
│   ├── MyOrder.png
│   ├── TrackOurOrder.png
│   ├── aboutus.png
│   ├── ContactUS.png
│   ├── Policy&Subscirbe.png
│   ├── admin01.png
│   ├── admin02.png
│   ├── admin03.png
│   └── admin04.png
│
└── README.md
>>>>>>> b2850247ca1a2d091c4281f91470bacb96f539ed
```

---
>>>>>>> 27cb7e258cd3fa0ab5492088546b5f3e717cfc93

## âš¡ Getting Started

### Prerequisites
<<<<<<< HEAD
- Node.js v18+
- MongoDB instance (local or Atlas)
=======

- Node.js 18+
- npm
- MongoDB instance
>>>>>>> 27cb7e258cd3fa0ab5492088546b5f3e717cfc93
- Stripe account
- Cloudinary account
- Resend account

<<<<<<< HEAD
### Installation
`ash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install admin dependencies
cd ../admin && npm install
`
=======
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
>>>>>>> 27cb7e258cd3fa0ab5492088546b5f3e717cfc93

---

<<<<<<< HEAD
#### Backend (ackend/.env)
`env
=======
## ðŸ” Environment Variables

Create `backend/.env`:

```env
>>>>>>> 27cb7e258cd3fa0ab5492088546b5f3e717cfc93
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
<<<<<<< HEAD
NEWSLETTER_CAMPAIGN_MAX_RECIPIENTS=2000
NEWSLETTER_UNSUBSCRIBE_SECRET=
`

#### Frontend (rontend/.env)
`env
=======
```

Create `frontend/.env`:

```env
>>>>>>> 27cb7e258cd3fa0ab5492088546b5f3e717cfc93
VITE_BACKEND_URL=
```

<<<<<<< HEAD
#### Admin (dmin/.env)
`env
=======
Create `admin/.env`:

```env
>>>>>>> 27cb7e258cd3fa0ab5492088546b5f3e717cfc93
VITE_BACKEND_URL=
```

<<<<<<< HEAD
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

## â˜ï¸ Deployment

Deployed on [Vercel](https://vercel.com/). Set environment variables in each Vercel project. Note: VITE_* variables are embedded at build time, so frontend/admin require fresh builds after changes.

## ðŸ”’ Security

- JWT authentication with secure verification
- Admin routes protected with custom auth middleware
- Stripe webhook signature verification with raw body
- HMAC unsubscribe tokens (no secrets stored in DB)
- CORS restricted to allowlisted origins
- Input sanitization and validation
- No secrets exposed in client code

## ðŸ“„ License

This project is licensed under the ISC License.
=======
> [!IMPORTANT]
> Never commit `.env` files, passwords, database credentials, API keys, or other secrets to GitHub.

---

## ðŸ’» Development

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

## ðŸ“¦ Production Build

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

## â˜ï¸ Deployment

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

<<<<<<< HEAD
- **Storefront:** https://forever-frontend-alpha-mauve.vercel.app
=======
- **Storefront:** https://forever-frontend-alpha-mauve.vercel.app/
>>>>>>> b2850247ca1a2d091c4281f91470bacb96f539ed
- **Admin:** https://admin-iota-six-18.vercel.app
- **Backend API:** https://forever-mu-orcin.vercel.app

---

## ðŸ”’ Security

- Password hashing with bcrypt
- JWT-based authentication and authorization
- Protected admin operations
- Input validation
- CORS configuration
- Environment-based secrets
- Stripe-managed payment processing
- Secure newsletter unsubscribe flow

---

## ðŸ—ºï¸ Roadmap

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

## ðŸ“„ License

This project is licensed under the **ISC License**.

---

### Built with MERN âš¡

**React Â· Node.js Â· Express Â· MongoDB**

Stripe Â· Cloudinary Â· Resend Â· Vercel

**2026**
>>>>>>> 27cb7e258cd3fa0ab5492088546b5f3e717cfc93


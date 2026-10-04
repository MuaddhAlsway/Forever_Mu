# E-Commerce Application

A full-stack MERN e-commerce application with admin panel, Stripe payments, newsletter campaigns, and order tracking.

## Tech Stack

### Frontend (Customer Store)
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [React Router](https://reactrouter.com/) - Client-side routing
- [Axios](https://axios-http.com/) - HTTP client
- [React Toastify](https://fkhadra.github.io/react-toastify/) - Notifications
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

### Admin Panel
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [React Router](https://reactrouter.com/) - Routing
- [Axios](https://axios-http.com/) - HTTP client
- [React Toastify](https://fkhadra.github.io/react-toastify/) - Notifications
- [Tailwind CSS](https://tailwindcss.com/) - Styling

### Backend
- [Node.js](https://nodejs.org/) - Runtime environment
- [Express](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Mongoose](https://mongoosejs.com/) - ODM
- [JWT](https://jwt.io/) - Authentication
- [Stripe](https://stripe.com/) - Payment processing
- [Cloudinary](https://cloudinary.com/) - Image storage/optimization
- [Resend](https://resend.com/) - Email service
- [bcrypt](https://www.npmjs.com/package/bcrypt) - Password hashing
- [Validator](https://www.npmjs.com/package/validator) - Input validation
- [cors](https://www.npmjs.com/package/cors) - CORS middleware
- [dotenv](https://www.npmjs.com/package/dotenv) - Environment variables

### Deployment
- [Vercel](https://vercel.com/) - Frontend, Admin & Backend hosting

## Features
- User authentication & authorization
- Product catalog with search & filtering
- Shopping cart management
- Address management
- COD & Stripe checkout
- Order tracking
- Newsletter subscription with unsubscribe
- Admin dashboard for products, orders & campaigns
- Campaign management with email delivery

## URLs
- **Storefront**: https://forever-frontend-ae4yjxczz-muaddhalsways-projects.vercel.app
- **Admin**: https://admin-iota-six-18.vercel.app
- **Backend API**: https://forever-mu-orcin.vercel.app

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB instance
- Stripe account
- Cloudinary account
- Resend account

### Installation
`ash
# Clone repository
git clone <repo-url>

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install admin dependencies
cd ../admin
npm install
`

### Environment Variables

#### Backend (.env)
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
`

#### Frontend (.env)
`env
VITE_BACKEND_URL=
`

#### Admin (.env)
`env
VITE_BACKEND_URL=
`

### Development
`ash
# Run backend
cd backend
npm run server

# Run frontend
cd frontend
npm run dev

# Run admin
cd admin
npm run dev
`

### Build
`ash
# Build frontend
cd frontend
npm run build

# Build admin
cd admin
npm run build
`

## License
ISC

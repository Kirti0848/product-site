# ProductPro React Frontend

This is the React frontend for the ProductPro e-commerce application. All EJS templates have been converted to React components.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL if needed:
```
REACT_APP_API_URL=http://localhost:8081
```

## Running the Application

### Development Mode
```bash
npm start
```
The app will open at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## Project Structure

```
client/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Navbar.css
│   │   ├── Layout.jsx
│   │   └── ProductCard.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Home.css
│   │   ├── Show.jsx
│   │   ├── Show.css
│   │   ├── NewProduct.jsx
│   │   ├── EditProduct.jsx
│   │   ├── Cart.jsx
│   │   ├── Cart.css
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── services/
│   │   └── api.js (API client using axios)
│   ├── context/
│   │   └── AuthContext.jsx (Authentication context)
│   ├── App.jsx (Main app with routing)
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── .env.example
```

## Converted Pages

- **Home** (index.ejs) - Shows all products with search functionality
- **Show** (show.ejs) - Product details page
- **New Product** (new.ejs) - Admin form to add new product
- **Edit Product** (edit.ejs) - Admin form to edit product
- **Cart** (cart.ejs) - Shopping cart with checkout
- **Login** (login.ejs) - User login
- **Signup** (signup.ejs) - User registration
- **Layout** (boilerplate.ejs) - Navigation bar and footer

## Features

- ✅ Authentication (Login/Signup)
- ✅ Product listing with search
- ✅ Product details view
- ✅ Add to cart functionality
- ✅ Cart management (add, remove, update quantity)
- ✅ Razorpay payment integration
- ✅ Admin panel for product CRUD
- ✅ Role-based access control
- ✅ Responsive design with Bootstrap

## Backend Requirements

The backend server should be running on `http://localhost:8081` with the following endpoints:

### Auth Routes
- `POST /signup` - Register user
- `POST /login` - Login user
- `GET /logout` - Logout user
- `GET /api/auth/profile` - Get current user profile

### Product Routes
- `GET /` - Get all products (supports search query)
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (admin)
- `PUT /products/:id` - Update product (admin)
- `DELETE /products/:id` - Delete product (admin)

### Cart Routes
- `POST /cart/add/:id` - Add item to cart
- `GET /cart` - Get cart items
- `DELETE /cart/:id` - Remove item from cart
- `PATCH /cart/:id/update` - Update quantity

### Payment Routes
- `POST /checkout` - Create Razorpay order
- `POST /payment/verify` - Verify payment signature

## Dependencies

- react@^18.2.0
- react-dom@^18.2.0
- react-router-dom@^6.8.0 - Client-side routing
- axios@^1.3.4 - HTTP client
- bootstrap@^5.3.0 - UI framework

## Notes

- Authentication is handled via sessions/cookies from the backend
- API calls use `credentials: 'include'` to send cookies
- Role-based routes (Admin) are protected with `ProtectedRoute` component
- File uploads use FormData for multipart requests

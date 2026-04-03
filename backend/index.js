require('dotenv').config();
const express = require("express");
const app = express();
const cors = require('cors');
const mongoose = require("mongoose");
const path = require("path");
const crypto = require('crypto');
const Product = require("./models/product.js");


 
const multer  = require('multer');
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Razorpay = require('razorpay');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_SYzJH3fq8frE0V';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '28pI67ueyIjdDhl3dmYr7j0J';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// --- CORS CONFIGURATION (Fixed for Session/Cookies) ---
app.use(cors({ 
    origin: [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
});

// --- SESSION CONFIGURATION ---
const sessionOptions = {
    secret: "supersecretstringmy",
    resave: false,
    saveUninitialized: false, // Security ke liye false behtar hai
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax', // React aur Node alag ports par hain isliye 'lax' zaroori hai
        secure: false    
    }
};

app.use(session(sessionOptions));

// --- PASSPORT CONFIGURATION ---
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- CUSTOM MIDDLEWARES ---
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: "Please login first" });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ success: false, error: "Permission Denied: Admin access required" });
};

// --- MULTER DISK STORAGE SETUP ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: function (req, file, cb) {
        const safeName = file.fieldname.replace(/[^a-zA-Z0-9-_]/g, '-');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${safeName}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// --- MIDDLEWARE ---
// Serve uploaded images from backend/public/uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve built React app only in production deployment.
if (IS_PRODUCTION) {
    app.use(express.static(path.join(__dirname, '../client/build')));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE ---
main()
  .then(() => console.log("Connection successful to MongoDB"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/Amazon");
}

// --- USER ROUTES ---

app.post("/signup", async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
        const assignedRole = role === 'admin' ? 'admin' : 'user';
        const newUser = new User({ email, username, role: assignedRole });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            res.json({ success: true, user: registeredUser });
        });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ success: false, error: "Invalid username or password" });
        req.logIn(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            return res.json({ success: true, user: user });
        });
    })(req, res, next);
});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.json({ success: true, message: "Logged out" });
    });
});

app.get('/api/auth/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.json(null);
    }
});

// --- PRODUCT ROUTES (All with /api for React) ---

app.get("/api/products", async (req, res) => {
    let { search, category, minPrice, maxPrice, discount } = req.query;
    try {
        let query = {};
        if (search && search.trim() !== "") {
            const regex = new RegExp(search, 'i');
            query = { $or: [{ title: regex }, { brand: regex }] };
        }
        if (category && category !== 'All') {
            query.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        }
        const hasMinPrice = minPrice !== undefined && minPrice !== '';
        const hasMaxPrice = maxPrice !== undefined && maxPrice !== '';
        if (hasMinPrice || hasMaxPrice) {
            query.price = {};
            if (hasMinPrice) {
                query.price.$gte = Number(minPrice);
            }
            if (hasMaxPrice) {
                query.price.$lte = Number(maxPrice);
            }
        }
        if (discount !== undefined && discount !== '') {
            query.discount = { $gte: Number(discount) };
        }
        const products = await Product.find(query);
        res.json({ products });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post("/api/products", isLoggedIn, isAdmin, upload.single('product[image]'), async (req, res) => {
    try {
        const productData = req.body.product;
        productData.discount = Number(productData.discount) || 0;
        if (req.file) {
            productData.image = `/uploads/${req.file.filename}`;
        }
        const newProduct = new Product(productData);
        await newProduct.save();
        res.json({ success: true, product: newProduct }); 
    } catch (err) {
        res.status(500).json({ error: "Error saving product." });
    }
});

app.get("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch product" });
    }
});

app.put("/api/products/:id", isLoggedIn, isAdmin, upload.single('product[image]'), async (req, res) => {
    try {
        let updatedData = { ...req.body.product };
        updatedData.discount = Number(updatedData.discount) || 0;
        if (req.file) updatedData.image = `/uploads/${req.file.filename}`;
        const updated = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.json({ success: true, product: updated }); 
    } catch (err) {
        res.status(500).json({ error: "Update failed." });
    }
});

app.delete("/api/products/:id", isLoggedIn, isAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Product deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

// --- CART ROUTES (Fixed 404 & Redirection) ---

app.post("/api/cart/add/:id", isLoggedIn, async (req, res) => {
    try {
        let { id } = req.params;
        let { quantity } = req.body;
        const qty = parseInt(quantity) || 1;

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        const user = await User.findById(req.user._id);
        const itemIndex = user.cart.findIndex(p => p.productId && p.productId.toString() === id);

        if (itemIndex > -1) {
            user.cart[itemIndex].quantity += qty;
        } else {
            user.cart.push({ productId: id, quantity: qty });
        }

        await user.save();
        res.json({ success: true, cart: user.cart }); 
    } catch (err) {
        res.status(500).json({ error: "Failed to add to cart" });
    }
});

app.get("/api/cart", isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("cart.productId");
        const cartItems = user.cart.filter(item => item.productId != null);
        res.json({ cart: cartItems });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch cart" });
    }
});

app.delete("/api/cart/:id", isLoggedIn, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user._id, {
            $pull: { cart: { _id: req.params.id } }
        }, { new: true }).populate("cart.productId");
        res.json({ success: true, cart: user.cart });
    } catch (err) {
        res.status(500).json({ error: "Failed to remove item" });
    }
});

app.patch("/api/cart/:id/update", isLoggedIn, async (req, res) => {
    try {
        let { id } = req.params;
        let { change } = req.body;
        const user = await User.findById(req.user._id);
        const itemIndex = user.cart.findIndex(item => item._id.toString() === id);

        if (itemIndex > -1) {
            user.cart[itemIndex].quantity += parseInt(change);
            if (user.cart[itemIndex].quantity < 1) user.cart[itemIndex].quantity = 1;
            await user.save();
        }
        res.json({ success: true, cart: user.cart });
    } catch (err) {
        res.status(500).json({ error: "Failed to update cart" });
    }
});

// --- CHECKOUT & PAYMENT ---

app.post("/api/checkout", isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("cart.productId");
        if (!user || user.cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });

        let totalAmount = 0;
        user.cart.forEach(item => {
            if (item.productId) totalAmount += item.productId.price * item.quantity;
        });

        const options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: RAZORPAY_KEY_ID
        });
    } catch (err) {
        res.status(500).json({ error: 'Payment Error' });
    }
});

app.post('/api/payment/verify', isLoggedIn, async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const generatedSignature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {
            const user = await User.findById(req.user._id).populate('cart.productId');

            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            const purchasedAt = new Date();
            const items = user.cart
                .filter(item => item.productId)
                .map(item => ({
                    productId: item.productId._id,
                    title: item.productId.title,
                    brand: item.productId.brand,
                    image: item.productId.image,
                    price: item.productId.price,
                    quantity: item.quantity
                }));

            const totalAmount = items.reduce(
                (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
                0
            );

            const orderHistoryEntry = {
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                currency: 'INR',
                totalAmount,
                items,
                purchasedAt
            };

            await User.findByIdAndUpdate(req.user._id, {
                $push: { orderHistory: orderHistoryEntry },
                $set: { cart: [] }
            });

            return res.json({
                success: true,
                message: 'Payment verified successfully',
                order: orderHistoryEntry
            });
        }

        return res.status(400).json({ success: false, error: 'Invalid signature' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Payment verification failed' });
    }
});

app.get('/api/orders/history', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('orderHistory username email').lean();

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const orderHistory = (user.orderHistory || []).slice().sort((a, b) => {
            return new Date(b.purchasedAt) - new Date(a.purchasedAt);
        });

        const summary = {
            orderCount: orderHistory.length,
            totalRevenue: orderHistory.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0),
            totalItems: orderHistory.reduce((sum, order) => {
                const count = (order.items || []).reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
                return sum + count;
            }, 0)
        };

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            summary,
            orders: orderHistory
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch order history' });
    }
});

app.get('/api/orders/admin-history', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const users = await User.find({
            orderHistory: { $exists: true, $ne: [] }
        }).select('username email orderHistory').lean();

        const orders = [];
        const customerMap = new Map();

        users.forEach((customer) => {
            const customerId = customer._id.toString();
            const username = customer.username || 'Unknown User';
            const email = customer.email || 'No email';

            (customer.orderHistory || []).forEach((order) => {
                const totalAmount = Number(order.totalAmount) || 0;
                const itemCount = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

                orders.push({
                    ...order,
                    customer: {
                        id: customer._id,
                        username,
                        email
                    },
                    itemCount
                });

                if (!customerMap.has(customerId)) {
                    customerMap.set(customerId, {
                        customer: {
                            id: customer._id,
                            username,
                            email
                        },
                        ordersCount: 0,
                        totalRevenue: 0,
                        totalItems: 0
                    });
                }

                const stats = customerMap.get(customerId);
                stats.ordersCount += 1;
                stats.totalRevenue += totalAmount;
                stats.totalItems += itemCount;
            });
        });

        orders.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));

        const summary = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0),
            totalItems: orders.reduce((sum, order) => sum + (Number(order.itemCount) || 0), 0),
            totalCustomers: customerMap.size
        };

        const customerStats = Array.from(customerMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

        return res.json({
            success: true,
            summary,
            customerStats,
            orders
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to fetch admin order history' });
    }
});

if (!IS_PRODUCTION) {
    app.get('/', (req, res) => {
        res.json({
            success: true,
            message: 'Backend is running',
            apiBase: '/api',
            frontendDevUrl: 'http://localhost:5173'
        });
    });
}

// --- REACT FRONTEND CATCH-ALL (PRODUCTION ONLY) ---
if (IS_PRODUCTION) {
    app.get(/^(?!\/api\/).*/, (req, res) => {
        const clientBuildPath = path.join(__dirname, "../client/build/index.html");
        res.sendFile(clientBuildPath);
    });
}

app.listen(8081, () => {
    console.log("Server is running on http://localhost:8081");
});
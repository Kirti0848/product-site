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

// --- CORS CONFIGURATION (Fixed for Session/Cookies) ---
app.use(cors({ 
    origin: [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_SXM7ZDeIFRMjXV',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'xStzabL5nY8P0PSGmutce3bE'
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
        cb(null, 'public/uploads/') 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- MIDDLEWARE ---
app.use(express.static(path.join(__dirname, "public")));
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
    let { search } = req.query;
    try {
        let query = {};
        if (search && search.trim() !== "") {
            const regex = new RegExp(search, 'i');
            query = { $or: [{ title: regex }, { brand: regex }] };
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
            key_id: process.env.RAZORPAY_KEY_ID || razorpay.key_id
        });
    } catch (err) {
        res.status(500).json({ error: 'Payment Error' });
    }
});

app.post('/api/payment/verify', isLoggedIn, async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'xStzabL5nY8P0PSGmutce3bE')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generatedSignature === razorpay_signature) {
        // Clear cart after successful payment
        await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
        return res.json({ success: true, message: 'Payment verified successfully' });
    }
    return res.status(400).json({ success: false, error: 'Invalid signature' });
});

// --- REACT FRONTEND CATCH-ALL ---
app.get(/^(?!\/api\/).*/, (req, res) => {
    const clientBuildPath = path.join(__dirname, "../client/build/index.html");
    if (require('fs').existsSync(clientBuildPath)) {
        res.sendFile(clientBuildPath);
    } else {
        res.status(404).json({ error: "Run 'npm run build' in the client folder." });
    }
});

app.listen(8081, () => {
    console.log("Server is running on http://localhost:8081");
});
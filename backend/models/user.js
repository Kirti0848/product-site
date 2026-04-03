const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default || require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // --- CART SECTION ADDED ---
    cart: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: "Product" // Ye aapke Product model ka naam hona chahiye
            },
            quantity: {
                type: Number,
                default: 1,
                min: 1
            }
        }
    ],
    orderHistory: [
        {
            razorpayOrderId: {
                type: String,
                required: true
            },
            razorpayPaymentId: {
                type: String,
                required: true
            },
            currency: {
                type: String,
                default: 'INR'
            },
            totalAmount: {
                type: Number,
                required: true,
                min: 0
            },
            items: [
                {
                    productId: {
                        type: Schema.Types.ObjectId,
                        ref: "Product"
                    },
                    title: String,
                    brand: String,
                    image: String,
                    price: {
                        type: Number,
                        default: 0
                    },
                    quantity: {
                        type: Number,
                        default: 1,
                        min: 1
                    }
                }
            ],
            purchasedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
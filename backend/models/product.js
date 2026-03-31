const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxLength: 100,
    },
    description: {
        type: String,
        maxLength: 500, // Description thoda bada rakhte hain
        default: '',
    },
    image: {
        type: String,
        default: "/uploads/default.png"
    },
    category: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    availability: {
        type: String,
        required: true,
        enum: ['In Stock', 'Out of Stock', 'Low Stock'],
        default: 'In Stock'
    },
    created_at: {
        type: Date,
        default: Date.now // Isse validation error solve ho jayega
    },
    updated_at: {
        type: Date,
        default: null,
    }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
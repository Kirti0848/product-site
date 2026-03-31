const Product = require('./models/product.js'); // Change 'Task' to 'Product'

const initDB = async () => {
    await Product.deleteMany({}); // Clears the database
    await Product.insertMany(allProducts); // Adds your iPhone array
    console.log("Data was initialized");
};

initDB(); // Don't forget to call the function!

let allProducts = [
    {
        title: 'Apple iPhone 13',
        description: 'The latest iPhone with A15 Bionic chip and improved camera system.',
        category: 'Electronics',
        brand: 'Apple',
        price: 999,
        rating: 4.5,
        availability: 'In Stock',
        created_at: new Date(),
    },
    {
        title: 'Samsung Galaxy S21',
        description: 'A powerful Android smartphone with a stunning display and versatile camera.',
        category: 'Electronics',
        brand: 'Samsung',
        price: 799,
        rating: 4.3,
        availability: 'In Stock',
        created_at: new Date(),
    },
    {
        title: 'Sony WH-1000XM4',
        description: 'Industry-leading noise-canceling headphones with exceptional sound quality.',
        category: 'Audio',
        brand: 'Sony',
        price: 349,
        rating: 4.7,
        availability: 'Low Stock',
        created_at: new Date(), 
    },
    {
        title: 'Hair Dryer',
        description: 'A powerful hair dryer with multiple heat and speed settings for salon-quality results.',
        category: 'Beauty',
        brand: 'Dyson',
        price: 399, 
        rating: 4.2,
        availability: 'In Stock',
        created_at: new Date(),
    }
];



// Don't need the old code below
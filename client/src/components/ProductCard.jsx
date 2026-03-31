import { Link } from 'react-router-dom';
import { API } from '../services/api'; // API import karna zaroori hai

const ProductCard = ({ product }) => {
    
    // Add to Cart Function
    const handleAddToCart = async () => {
        try {
            const response = await API.addToCart(product._id, 1);
            if (response.data.success) {
                alert("🛒 Product added to cart successfully!");
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                alert("⚠️ Please login first to add items to cart!");
            } else {
                alert("❌ Failed to add product to cart.");
                console.error(err);
            }
        }
    };

    // Image Path Fix: Agar image path '/' se shuru hota hai toh backend URL lagao
    const imageUrl = product.image.startsWith('http') 
        ? product.image 
        : `http://localhost:8081${product.image}`;

    return (
        <div className="card h-100 shadow-sm border-0 product-card">
            <img
                src={imageUrl}
                className="card-img-top"
                style={{
                    height: '220px',
                    width: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#f8f9fa',
                    padding: '10px'
                }}
                alt={product.title}
            />
            <div className="card-body">
                <h6 className="product-title fw-bold text-truncate">{product.title}</h6>
                <p className="text-muted small mb-2">{product.brand}</p>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold text-dark fs-5">₹{product.price}</span>
                    <span className={`badge rounded-pill ${product.availability === 'In Stock' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {product.availability}
                    </span>
                </div>
                
                {/* --- ADD TO CART BUTTON --- */}
                <button 
                    disabled={product.stock <= 0 && product.availability === 'Out of Stock'} 
                    onClick={handleAddToCart}
                    className="btn btn-warning w-100"
                >
                    Add to Cart
                </button>

                <Link to={`/products/${product._id}`} className="btn btn-outline-dark btn-sm w-100 py-2 rounded-pill">
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default ProductCard;
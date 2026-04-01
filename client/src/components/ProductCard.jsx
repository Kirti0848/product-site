import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API } from '../services/api'; // API import karna zaroori hai

const ProductCard = ({ product }) => {
    const CART_COUNT_KEY = 'cartCount';
    const { setUser } = useContext(AuthContext);
    
    // Add to Cart Function
    const handleAddToCart = async () => {
        try {
            const response = await API.addToCart(product._id, 1);
            if (response.data.success) {
                let apiCart = Array.isArray(response.data.cart) ? response.data.cart : null;

                // Always read latest cart from server so badge stays in sync immediately.
                try {
                    const cartResponse = await API.getCart();
                    if (Array.isArray(cartResponse.data?.cart)) {
                        apiCart = cartResponse.data.cart;
                    }
                } catch (cartErr) {
                    console.error('Failed to refresh cart after add:', cartErr);
                }

                const totalQuantity = apiCart
                    ? apiCart.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
                    : (Number(localStorage.getItem(CART_COUNT_KEY)) || 0) + 1;

                if (apiCart) {
                    setUser((prev) => (prev ? { ...prev, cart: apiCart } : prev));
                }

                localStorage.setItem(CART_COUNT_KEY, String(totalQuantity));
                window.dispatchEvent(new CustomEvent('cart:updated', {
                    detail: { cartLength: totalQuantity }
                }));
            }
        } catch (err) {
            console.error('Failed to add product to cart:', err);
        }
    };

    // Image Path Fix: Agar image path '/' se shuru hota hai toh backend URL lagao
    const imagePath = product.image || '';
const imageUrl = imagePath.startsWith('http')
    ? imagePath
    : `http://localhost:8081${encodeURI(imagePath)}`;
    

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
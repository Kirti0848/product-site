import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API } from '../services/api';
import './Show.css';

const Show = () => {
    const { id } = useParams();
    const { user, setUser } = useContext(AuthContext);
    const CART_COUNT_KEY = 'cartCount';
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await API.getProduct(id);
                setProduct(response.data);
            } catch (err) {
                console.error('Failed to fetch product:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const qty = parseInt(quantity, 10) || 1;
            const response = await API.addToCart(id, qty);

            if (response.data?.success) {
                let apiCart = Array.isArray(response.data.cart) ? response.data.cart : null;

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
                    : (Number(localStorage.getItem(CART_COUNT_KEY)) || 0) + qty;

                if (apiCart) {
                    setUser((prev) => (prev ? { ...prev, cart: apiCart } : prev));
                }

                localStorage.setItem(CART_COUNT_KEY, String(totalQuantity));
                window.dispatchEvent(new CustomEvent('cart:updated', {
                    detail: { cartLength: totalQuantity }
                }));
            }

            navigate('/cart');
        } catch (err) {
            console.error('Failed to add to cart:', err);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await API.deleteProduct(id);
                navigate('/');
            } catch (err) {
                console.error('Failed to delete product:', err);
                alert('Error deleting product');
            }
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-5">
                <p className="text-muted">Product not found</p>
            </div>
        );
    }

    const imagePath = product.image || '';
    const imageUrl = imagePath.startsWith('http')
        ? imagePath
        : `http://localhost:8081${encodeURI(imagePath)}`;
    const discount = Number(product.discount) || 0;
    const mrp = discount > 0
        ? Math.round(product.price / (1 - discount / 100))
        : null;

    return (
        <div className="container product-container">
            <div className="row">
                <div className="col-md-6 mb-4">
                    <div className="img-box shadow-sm">
                        <img
                            src={imageUrl}
                            alt={product.title}
                            className="main-img"
                            onError={(e) => {
                                e.currentTarget.src = 'http://localhost:8081/uploads/No_Image_Available.jpg';
                            }}
                        />
                    </div>
                </div>

                <div className="col-md-6 ps-lg-5">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-2">
                            <li className="breadcrumb-item">
                                <Link to="/" className="text-decoration-none text-muted small">
                                    Products
                                </Link>
                            </li>
                            <li className="breadcrumb-item active small text-capitalize">
                                {product.brand}
                            </li>
                        </ol>
                    </nav>

                    <h1 className="fw-bold mb-1">{product.title}</h1>
                    <p className="text-muted mb-3 small">
                        Brand: <span className="text-primary fw-600">{product.brand}</span>
                    </p>

                    <div className="d-flex align-items-center mb-3">
                        <div className="text-warning me-2 small">
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star-half-alt"></i>
                        </div>
                        <span className="text-primary small fw-500" style={{ cursor: 'pointer' }}>
                            2,450 ratings
                        </span>
                    </div>

                    <hr />

                    <div className="mb-4">
                        <div className="d-flex align-items-baseline flex-wrap gap-2">
                            {discount > 0 && <span className="text-danger fs-4 fw-light me-2">-{discount}%</span>}
                            <span className="price-tag">₹{product.price}</span>
                        </div>
                        {mrp && (
                            <p className="text-muted small">
                                M.R.P.: <del>₹{mrp}</del>
                            </p>
                        )}
                        <p className="small text-dark mb-0">
                            <i className="fas fa-info-circle text-muted me-1"></i> Inclusive of all taxes
                        </p>
                    </div>

                    <div className="row mb-4 border-top border-bottom py-3 bg-white mx-0 rounded shadow-sm">
                        <div className="col-4 text-center border-end">
                            <div className="feature-icon">
                                <i className="fas fa-truck-fast fa-xl"></i><br />
                                Free Delivery
                            </div>
                        </div>
                        <div className="col-4 text-center border-end">
                            <div className="feature-icon">
                                <i className="fas fa-shield-halved fa-xl"></i><br />
                                1 Year Warranty
                            </div>
                        </div>
                        <div className="col-4 text-center">
                            <div className="feature-icon">
                                <i className="fas fa-arrow-rotate-left fa-xl"></i><br />
                                Easy Returns
                            </div>
                        </div>
                    </div>

                    <h5 className="fw-bold mb-3 fs-6">About this item</h5>
                    <p className="text-secondary small" style={{ lineHeight: '1.8', textAlign: 'justify' }}>
                        {product.description}
                    </p>

                    <div className="card p-4 mt-4 shadow-sm border-0" style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #ddd !important' }}>
                        <div className="mb-3">
                            <span className={`fw-bold ${product.availability === 'In Stock' ? 'text-success' : 'text-danger'}`}>
                                <i className="fas fa-circle fs-xs me-1"></i> {product.availability}
                            </span>
                        </div>

                        {user && user.role === 'admin' ? (
                            <>
                                <div className="alert alert-dark py-2 small border-0 mb-3" style={{ background: '#232f3e', color: '#fff' }}>
                                    <i className="fas fa-user-shield me-2"></i> Authorized Admin Access
                                </div>
                                <div className="d-flex gap-2">
                                    <Link to={`/products/${product._id}/edit`} className="btn btn-dark rounded-pill flex-grow-1 py-2">
                                        <i className="fas fa-pen-to-square me-2"></i>Edit
                                    </Link>
                                    <button onClick={handleDelete} className="btn btn-outline-danger rounded-pill flex-grow-1 py-2">
                                        <i className="fas fa-trash-can me-2"></i>Remove
                                    </button>
                                </div>
                            </>
                        ) : user ? (
                            <form onSubmit={handleAddToCart} className="mb-3">
                                <div className="d-flex align-items-center mb-3">
                                    <label className="small fw-bold me-3">Qty:</label>
                                    <select
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="quantity-input"
                                    >
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-buy w-100 py-2 mb-2 shadow-sm">
                                    Add to Cart
                                </button>
                            </form>
                        ) : (
                            <div className="text-center">
                                <p className="small text-muted mb-3">Sign in to add this item to your cart</p>
                                <Link to="/login" className="btn btn-buy w-100 py-2">
                                    Sign in to buy
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <Link to="/" className="text-decoration-none text-muted small">
                            <i className="fas fa-chevron-left me-1"></i> Back to all products
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Show;

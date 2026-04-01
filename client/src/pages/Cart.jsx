import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API } from '../services/api';
import './Cart.css';

const Cart = () => {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCart();
    }, [user]); // Added user as dependency

    const fetchCart = async () => {
        try {
            if (user) {
                const response = await API.getCart();
                setCart(response.data.cart || []);
            }
        } catch (err) {
            console.error('Failed to fetch cart:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            await API.removeFromCart(itemId);
            const updatedCart = cart.filter(item => item._id !== itemId);
            setCart(updatedCart);
            const totalQuantity = updatedCart.reduce(
                (total, item) => total + (Number(item.quantity) || 0),
                0
            );
            window.dispatchEvent(new CustomEvent('cart:updated', {
                detail: { cartLength: totalQuantity }
            }));
        } catch (err) {
            console.error('Failed to remove item:', err);
            alert('Error removing item from cart');
        }
    };

    const handleUpdateQuantity = async (itemId, change) => {
        try {
            await API.updateCartQuantity(itemId, change);
            const updatedCart = cart.map(item => {
                if (item._id === itemId) {
                    const newQty = item.quantity + change;
                    return { ...item, quantity: newQty < 1 ? 1 : newQty };
                }
                return item;
            });
            setCart(updatedCart);
            const totalQuantity = updatedCart.reduce(
                (total, item) => total + (Number(item.quantity) || 0),
                0
            );
            window.dispatchEvent(new CustomEvent('cart:updated', {
                detail: { cartLength: totalQuantity }
            }));
        } catch (err) {
            console.error('Failed to update quantity:', err);
            alert('Error updating quantity');
        }
    };

    const handleCheckout = async () => {
        try {
            const response = await API.checkout();
            const data = response.data;

            if (!data.orderId) {
                alert('Error creating order');
                return;
            }

            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency || 'INR',
                name: 'Velura Premium',
                description: 'Purchase from Cart',
                image: 'https://cdn-icons-png.flaticon.com/512/1170/1170576.png',
                order_id: data.orderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await API.verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            window.dispatchEvent(new CustomEvent('cart:updated', {
                                detail: { cartLength: 0 }
                            }));
                            alert('🎉 Payment successful!');
                            window.location.href = '/';
                        } else {
                            alert('Payment verification failed');
                        }
                    } catch (verifyError) {
                        console.error('Verification error', verifyError);
                        alert('Payment succeeded but verification failed.');
                    }
                },
                prefill: {
                    name: user?.username || '',
                    email: user?.email || ''
                },
                theme: {
                    color: '#232f3e'
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', (response) => {
                alert('Payment failed: ' + response.error.description);
            });
            razorpay.open();
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error initiating checkout');
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

    const cartItems = cart.filter(item => item.productId);
    let subtotal = 0;
    cartItems.forEach(item => {
        subtotal += (item.productId?.price || 0) * item.quantity;
    });

    return (
        <div className="container cart-container py-5">
            <div className="row">
                <div className="col-lg-8">
                    <div className="d-flex justify-content-between align-items-end border-bottom pb-2 mb-4">
                        <h2 className="fw-bold mb-0">Shopping Cart</h2>
                        <span className="text-muted small">Price</span>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="text-center py-5 bg-white shadow-sm rounded-4">
                            <i className="fa-solid fa-cart-shopping fa-4x text-muted mb-3 opacity-25"></i>
                            <h4 className="text-muted">Your Velura cart is empty.</h4>
                            <p className="small text-secondary px-3">
                                Your shopping cart lives to serve. Give it purpose — fill it with electronics, 
                                household supplies, clothing, and more.
                            </p>
                            <Link to="/" className="btn btn-warning rounded-pill px-4 fw-bold mt-2">
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <>
                            {cartItems.map(item => {
                                // Image URL Fix
                                const imagePath = item.productId.image || '';
                                const imageUrl = imagePath.startsWith('http')
                                    ? imagePath
                                    : `http://localhost:8081${encodeURI(imagePath)}`;

                                return (
                                    <div key={item._id} className="cart-card p-3 mb-3 shadow-sm bg-white rounded-3">
                                        <div className="row align-items-center">
                                            <div className="col-3 col-md-2 text-center">
                                                <Link to={`/products/${item.productId._id}`}>
                                                    <img
                                                        src={imageUrl}
                                                        className="cart-img shadow-sm rounded"
                                                        alt="product"
                                                        style={{ width: '100%', height: '80px', objectFit: 'contain' }}
                                                    />
                                                </Link>
                                            </div>

                                            <div className="col-6 col-md-7 ps-md-4">
                                                <Link to={`/products/${item.productId._id}`} className="text-decoration-none">
                                                    <h5 className="fw-bold text-dark mb-1 text-truncate">
                                                        {item.productId.title}
                                                    </h5>
                                                </Link>
                                                <p className="text-muted small mb-2">
                                                    Brand: <b>{item.productId.brand}</b>
                                                </p>

                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="input-group input-group-sm" style={{ width: 'fit-content' }}>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item._id, -1)}
                                                            className="btn btn-outline-secondary"
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <i className="fa-solid fa-minus"></i>
                                                        </button>
                                                        <span className="input-group-text bg-white px-3">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item._id, 1)}
                                                            className="btn btn-outline-secondary"
                                                        >
                                                            <i className="fa-solid fa-plus"></i>
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveItem(item._id)}
                                                        className="btn btn-link text-danger text-decoration-none p-0 small"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="col-3 text-end">
                                                <h5 className="fw-bold text-dark mb-0">
                                                    ₹{(item.productId.price * item.quantity).toLocaleString()}
                                                </h5>
                                                <p className="text-muted x-small mt-1 mb-0">₹{item.productId.price} each</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="col-lg-4 mt-4 mt-lg-0">
                        <div className="summary-card p-4 shadow-sm bg-white rounded-3 sticky-top" style={{ top: '20px' }}>
                            <div className="mb-3 d-flex align-items-center text-success small fw-bold">
                                <i className="fa-solid fa-circle-check me-2"></i>
                                <span>Your order qualifies for FREE Shipping.</span>
                            </div>

                            <h4 className="mb-4 fs-5">
                                Subtotal ({cartItems.length} items):{' '}
                                <span className="fw-bold d-block mt-2 fs-3 text-dark">₹{subtotal.toLocaleString()}</span>
                            </h4>

                            <button
                                onClick={handleCheckout}
                                className="btn btn-warning w-100 py-3 shadow-sm mb-3 rounded-pill fw-bold"
                                style={{ backgroundColor: '#FFD814', borderColor: '#FCD200' }}
                            >
                                Proceed to Checkout
                            </button>
                            
                            <div className="text-center">
                                <Link to="/" className="text-decoration-none small text-primary">
                                    Keep Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
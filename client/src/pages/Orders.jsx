import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API } from '../services/api';
import './Orders.css';

const money = (value = 0) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value) => {
    if (!value) return 'Just now';
    return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

const Orders = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState({
        orderCount: 0,
        totalRevenue: 0,
        totalItems: 0,
        totalCustomers: 0
    });
    const [customerStats, setCustomerStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const recentOrder = location.state?.recentOrder;

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = user?.role === 'admin'
                    ? await API.getAdminOrderHistory()
                    : await API.getOrderHistory();

                const fetchedOrders = Array.isArray(response.data?.orders) ? response.data.orders : [];
                setOrders(fetchedOrders);

                if (response.data?.summary) {
                    setSummary((prev) => ({
                        ...prev,
                        ...response.data.summary,
                        orderCount: response.data.summary.orderCount ?? response.data.summary.totalOrders ?? 0,
                        totalRevenue: response.data.summary.totalRevenue ?? 0,
                        totalItems: response.data.summary.totalItems ?? 0,
                        totalCustomers: response.data.summary.totalCustomers ?? 0
                    }));
                }

                if (Array.isArray(response.data?.customerStats)) {
                    setCustomerStats(response.data.customerStats);
                }
            } catch (err) {
                console.error('Failed to fetch order history:', err);
                setError('Could not load your purchase history right now.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    const displayOrders = useMemo(() => {
        if (!recentOrder) {
            return orders;
        }

        const combined = [recentOrder, ...orders];
        const seen = new Set();

        return combined.filter((order) => {
            const key = `${order.razorpayOrderId}-${order.razorpayPaymentId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [orders, recentOrder]);

    const computedSummary = useMemo(() => {
        const totalSpent = displayOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
        const itemCount = displayOrders.reduce((sum, order) => sum + (order.items || []).reduce((acc, item) => acc + (Number(item.quantity) || 0), 0), 0);

        return {
            orderCount: displayOrders.length,
            totalRevenue: totalSpent,
            itemCount
        };
    }, [displayOrders]);

    const latestOrder = displayOrders[0];

    if (loading) {
        return (
            <div className="orders-page loading-state text-center py-5">
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="orders-hero">
                <div className="container py-5 position-relative">
                    <div className="row align-items-center gy-4">
                        <div className="col-lg-8">
                            <span className="orders-kicker">{user?.role === 'admin' ? 'Admin Order Console' : 'Order History'}</span>
                            <h1 className="display-5 fw-bold text-white mb-3">
                                {user?.role === 'admin'
                                    ? 'Track who ordered what and monitor revenue in one place.'
                                    : 'Your order history and payment details.'}
                            </h1>
                            <p className="text-white-50 mb-0 orders-lead">
                                {user?.role === 'admin'
                                    ? 'View customer-wise order activity, item details, and business totals in real time.'
                                    : 'Track the payment, review the full item snapshot, and revisit every order from one place.'}
                            </p>
                        </div>
                        <div className="col-lg-4">
                            <div className="hero-summary-card">
                                <div className="summary-value">{summary.orderCount || computedSummary.orderCount}</div>
                                <div className="summary-label">Orders recorded</div>
                                <div className="summary-meta mt-3">
                                    {user?.role === 'admin' ? 'Total revenue' : 'Total spent'}: {money(summary.totalRevenue || computedSummary.totalRevenue)}
                                </div>
                                <div className="summary-meta">Items purchased: {summary.totalItems || computedSummary.itemCount}</div>
                                {user?.role === 'admin' && (
                                    <div className="summary-meta">Customers: {summary.totalCustomers}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5">
                {error && (
                    <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-4">
                        {error}
                    </div>
                )}

                {recentOrder && (
                    <div className="recent-order-panel mb-5 shadow-sm">
                        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center mb-4">
                            <div>
                                <span className="section-tag">Latest payment</span>
                                <h2 className="fw-bold mb-1">Order received successfully</h2>
                                <p className="text-muted mb-0">This is the order that was just confirmed after payment verification.</p>
                            </div>
                            <div className="text-md-end">
                                <div className="order-total">{money(recentOrder.totalAmount)}</div>
                                <div className="text-muted small">{formatDate(recentOrder.purchasedAt)}</div>
                            </div>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <div className="detail-pill">
                                    <span>Razorpay order</span>
                                    <strong>{recentOrder.razorpayOrderId}</strong>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="detail-pill">
                                    <span>Payment ID</span>
                                    <strong>{recentOrder.razorpayPaymentId}</strong>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="detail-pill">
                                    <span>Currency</span>
                                    <strong>{recentOrder.currency || 'INR'}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="order-items">
                            {recentOrder.items?.map((item) => {
                                const imagePath = item.image || '';
                                const imageUrl = imagePath.startsWith('http')
                                    ? imagePath
                                    : `http://localhost:8081${encodeURI(imagePath)}`;

                                return (
                                    <div key={`${item.productId}-${item.title}`} className="order-item-row">
                                        <Link to={`/products/${item.productId}`} className="order-thumb-wrap">
                                            <img src={imageUrl} alt={item.title} className="order-thumb" />
                                        </Link>
                                        <div className="flex-grow-1">
                                            <Link to={`/products/${item.productId}`} className="text-decoration-none text-dark">
                                                <h5 className="mb-1 fw-semibold">{item.title}</h5>
                                            </Link>
                                            <div className="text-muted small mb-2">{item.brand}</div>
                                            <div className="d-flex flex-wrap gap-3 small text-secondary">
                                                <span>Qty: {item.quantity}</span>
                                                <span>Unit: {money(item.price)}</span>
                                            </div>
                                        </div>
                                        <div className="text-end fw-bold text-dark">
                                            {money((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {user?.role === 'admin' && customerStats.length > 0 && (
                    <div className="customer-insights mb-5">
                        <div className="d-flex justify-content-between align-items-end mb-3">
                            <div>
                                <span className="section-tag">Insights</span>
                                <h3 className="fw-bold mb-0">Customer order insights</h3>
                            </div>
                        </div>

                        <div className="insights-grid">
                            {customerStats.slice(0, 6).map((entry) => (
                                <div className="insight-card" key={entry.customer.id || entry.customer.email}>
                                    <div className="insight-title">{entry.customer.username}</div>
                                    <div className="insight-subtitle">{entry.customer.email}</div>
                                    <div className="insight-metrics mt-3">
                                        <span>Orders: {entry.ordersCount}</span>
                                        <span>Items: {entry.totalItems}</span>
                                        <strong>Revenue: {money(entry.totalRevenue)}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-end mb-4">
                    <div>
                        <span className="section-tag">History</span>
                        <h3 className="fw-bold mb-0">
                            {user?.role === 'admin' ? 'All customers order history' : 'Complete purchase history'}
                        </h3>
                    </div>
                    <Link to="/" className="btn btn-outline-dark rounded-pill px-4">
                        Continue shopping
                    </Link>
                </div>

                {displayOrders.length === 0 ? (
                    <div className="empty-history shadow-sm">
                        <h4 className="fw-bold mb-2">No purchases yet</h4>
                        <p className="text-muted mb-4">Once you complete a payment, the receipt and item snapshot will appear here.</p>
                        <Link to="/" className="btn btn-warning rounded-pill px-4 fw-semibold">
                            Browse products
                        </Link>
                    </div>
                ) : (
                    <div className="history-list">
                        {displayOrders.map((order) => (
                            <div key={`${order.razorpayOrderId}-${order.razorpayPaymentId}`} className="history-card shadow-sm">
                                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                                    <div>
                                        <div className="history-title">{formatDate(order.purchasedAt)}</div>
                                        <div className="text-muted small">{order.items?.length || 0} item(s) in this order</div>
                                        {user?.role === 'admin' && order.customer && (
                                            <div className="customer-badge mt-2">
                                                <strong>{order.customer.username}</strong>
                                                <span>{order.customer.email}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-md-end">
                                        <div className="history-total">{money(order.totalAmount)}</div>
                                        <div className="text-muted small">{order.currency || 'INR'}</div>
                                    </div>
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <div className="detail-pill muted">
                                            <span>Order ID</span>
                                            <strong>{order.razorpayOrderId}</strong>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="detail-pill muted">
                                            <span>Payment ID</span>
                                            <strong>{order.razorpayPaymentId}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="order-items compact">
                                    {order.items?.map((item) => {
                                        const imagePath = item.image || '';
                                        const imageUrl = imagePath.startsWith('http')
                                            ? imagePath
                                            : `http://localhost:8081${encodeURI(imagePath)}`;

                                        return (
                                            <div key={`${order.razorpayOrderId}-${item.productId}-${item.title}`} className="order-item-row compact-row">
                                                <Link to={`/products/${item.productId}`} className="order-thumb-wrap">
                                                    <img src={imageUrl} alt={item.title} className="order-thumb" />
                                                </Link>
                                                <div className="flex-grow-1">
                                                    <Link to={`/products/${item.productId}`} className="text-decoration-none text-dark">
                                                        <h6 className="mb-1 fw-semibold">{item.title}</h6>
                                                    </Link>
                                                    <div className="text-muted small">{item.brand}</div>
                                                </div>
                                                <div className="text-end small text-secondary">
                                                    <div>Qty {item.quantity}</div>
                                                    <strong className="text-dark">{money((Number(item.price) || 0) * (Number(item.quantity) || 0))}</strong>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
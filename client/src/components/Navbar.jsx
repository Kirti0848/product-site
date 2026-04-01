import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [search, setSearch] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const navigate = useNavigate();
    const CART_COUNT_KEY = 'cartCount';

    const getTotalQuantity = (cart = []) =>
        cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);

    const saveCartCount = (count) => {
        localStorage.setItem(CART_COUNT_KEY, String(count));
    };

    useEffect(() => {
        const stored = Number(localStorage.getItem(CART_COUNT_KEY));
        if (!Number.isNaN(stored)) {
            setCartCount(stored);
        }
    }, []);

    useEffect(() => {
        if (Array.isArray(user?.cart)) {
            const nextCount = getTotalQuantity(user.cart);
            setCartCount(nextCount);
            saveCartCount(nextCount);
        }
    }, [user]);

    useEffect(() => {
        const handleCartUpdated = (event) => {
            if (typeof event.detail?.cartLength === 'number') {
                setCartCount(event.detail.cartLength);
                saveCartCount(event.detail.cartLength);
            }
        };

        window.addEventListener('cart:updated', handleCartUpdated);
        return () => window.removeEventListener('cart:updated', handleCartUpdated);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/?search=${encodeURIComponent(search)}`);
            setMenuOpen(false);
        }
    };

    const handleLogout = async () => {
        setProfileOpen(false);
        setMenuOpen(false);
        await logout();
    };

    return (
        <nav className="navbar navbar-expand-md navbar-dark sticky-top shadow-sm" style={{ backgroundColor: '#131921' }}>
            <div className="container-fluid">
                <Link className="navbar-brand text-white fw-bold fs-3 me-4" to="/">
                    Velura
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-expanded={menuOpen}
                    aria-controls="navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
                    <form className="d-flex mx-auto w-50" onSubmit={handleSearch}>
                        <div className="input-group">
                            <input
                                type="search"
                                className="form-control border-0 shadow-none ps-3"
                                placeholder="Search Products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ borderRadius: '4px 0 0 4px', height: '40px' }}
                            />
                            <button
                                className="btn btn-warning border-0 px-4"
                                type="submit"
                                style={{ borderRadius: '0 4px 4px 0', backgroundColor: '#febd69' }}
                            >
                                <i className="fa-solid fa-magnifying-glass text-dark"></i>
                            </button>
                        </div>
                    </form>

                    <div className="navbar-nav ms-auto align-items-center">
                        <Link className="nav-link me-2" to="/">
                            <i className="fa-solid fa-house"></i> Home
                        </Link>

                        {!user ? (
                            <>
                                <Link className="nav-link me-2" to="/login" onClick={() => setMenuOpen(false)}>
                                    Login
                                </Link>
                                <Link className="btn btn-warning fw-bold px-3 rounded-1" to="/signup"
                                    onClick={() => setMenuOpen(false)}
                                    style={{ backgroundColor: '#f0c14b' }}>
                                    Sign Up
                                </Link>
                            </>
                        ) : (
                            <>
                                {user.role === 'user' && (
                                    <Link className="nav-link me-3 position-relative" to="/cart" onClick={() => setMenuOpen(false)}>
                                        <i className="fa-solid fa-cart-shopping fs-5"></i>
                                        <span className="cart-badge">
                                            {cartCount}
                                        </span>
                                    </Link>
                                )}

                                {user.role === 'admin' && (
                                    <Link className="nav-link me-2 text-warning" to="/products/new" onClick={() => setMenuOpen(false)}>
                                        <i className="fa-solid fa-plus-square"></i> Add Product
                                    </Link>
                                )}

                                <div className="nav-item dropdown position-relative" ref={profileRef}>
                                    <button
                                        className="nav-link dropdown-toggle btn btn-link text-decoration-none"
                                        type="button"
                                        onClick={() => setProfileOpen((prev) => !prev)}
                                        aria-expanded={profileOpen}
                                    >
                                        <i className="fa-solid fa-user-circle"></i> {user.username}
                                    </button>
                                    <ul
                                        className="dropdown-menu dropdown-menu-end shadow border-0"
                                        style={{
                                            display: profileOpen ? 'block' : 'none',
                                            zIndex: 2000
                                        }}
                                    >
                                        <li>
                                            <button
                                                className="dropdown-item small"
                                                type="button"
                                                onClick={() => {
                                                    setProfileOpen(false);
                                                    setMenuOpen(false);
                                                }}
                                            >
                                                My Orders
                                            </button>
                                        </li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button
                                                className="dropdown-item small text-danger"
                                                onClick={handleLogout}
                                            >
                                                Logout
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

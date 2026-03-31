import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/?search=${encodeURIComponent(search)}`);
        }
    };

    return (
        <nav className="navbar navbar-expand-md navbar-dark sticky-top shadow-sm" style={{ backgroundColor: '#131921' }}>
            <div className="container-fluid">
                <Link className="navbar-brand text-white fw-bold fs-3 me-4" to="/">
                    Velura
                </Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
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
                                <Link className="nav-link me-2" to="/login">
                                    Login
                                </Link>
                                <Link className="btn btn-warning fw-bold px-3 rounded-1" to="/signup"
                                    style={{ backgroundColor: '#f0c14b' }}>
                                    Sign Up
                                </Link>
                            </>
                        ) : (
                            <>
                                {user.role === 'user' && (
                                    <Link className="nav-link me-3 position-relative" to="/cart">
                                        <i className="fa-solid fa-cart-shopping fs-5"></i>
                                        <span className="cart-badge">
                                            {user.cart ? user.cart.length : 0}
                                        </span>
                                    </Link>
                                )}

                                {user.role === 'admin' && (
                                    <Link className="nav-link me-2 text-warning" to="/products/new">
                                        <i className="fa-solid fa-plus-square"></i> Add Product
                                    </Link>
                                )}

                                <div className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle" href="#" role="button"
                                        data-bs-toggle="dropdown">
                                        <i className="fa-solid fa-user-circle"></i> {user.username}
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                        <li>
                                            <a className="dropdown-item small" href="#">
                                                My Orders
                                            </a>
                                        </li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button
                                                className="dropdown-item small text-danger"
                                                onClick={logout}
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

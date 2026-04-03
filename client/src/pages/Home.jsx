import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { AuthContext } from '../context/AuthContext';
import { API } from '../services/api';
import './Home.css';

const CATEGORY_OPTIONS = [
    'Electronics',
    'Fashion',
    'Home',
    'Books',
    'Beauty',
    'Sports',
    'Grocery'
];

const DISCOUNT_OPTIONS = [10, 20, 30, 40];

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: 'All',
        minPrice: '',
        maxPrice: '',
        discount: 'All'
    });
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const search = searchParams.get('search') || '';

    const querySummary = useMemo(() => {
        return [
            search ? `Search: ${search}` : null,
            filters.category !== 'All' ? `Category: ${filters.category}` : null,
            filters.minPrice ? `Min ₹${filters.minPrice}` : null,
            filters.maxPrice ? `Max ₹${filters.maxPrice}` : null,
            filters.discount !== 'All' ? `${filters.discount}%+ discount` : null
        ].filter(Boolean);
    }, [filters, search]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const requestParams = {};
                const category = searchParams.get('category') || '';
                const minPrice = searchParams.get('minPrice') || '';
                const maxPrice = searchParams.get('maxPrice') || '';
                const discount = searchParams.get('discount') || '';

                if (search) requestParams.search = search;
                if (category) requestParams.category = category;
                if (minPrice) requestParams.minPrice = minPrice;
                if (maxPrice) requestParams.maxPrice = maxPrice;
                if (discount) requestParams.discount = discount;

                const response = await API.getProducts(requestParams);
                setProducts(response.data.products || []);
            } catch (err) {
                console.error('Failed to fetch products:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [search, searchParams]);

    useEffect(() => {
        setFilters({
            category: searchParams.get('category') || 'All',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            discount: searchParams.get('discount') || 'All'
        });
    }, [searchParams]);

    const updateQuery = (nextFilters) => {
        const params = new URLSearchParams();

        if (search) {
            params.set('search', search);
        }

        if (nextFilters.category && nextFilters.category !== 'All') {
            params.set('category', nextFilters.category);
        }

        if (nextFilters.minPrice) {
            params.set('minPrice', nextFilters.minPrice);
        }

        if (nextFilters.maxPrice) {
            params.set('maxPrice', nextFilters.maxPrice);
        }

        if (nextFilters.discount && nextFilters.discount !== 'All') {
            params.set('discount', nextFilters.discount);
        }

        navigate(`/?${params.toString()}`);
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        updateQuery(filters);
    };

    const handleQuickCategory = (category) => {
        const nextFilters = { ...filters, category };
        setFilters(nextFilters);
        updateQuery(nextFilters);
    };

    const handleQuickDiscount = (discount) => {
        const nextFilters = { ...filters, discount: String(discount) };
        setFilters(nextFilters);
        updateQuery(nextFilters);
    };

    const handleReset = () => {
        setFilters({ category: 'All', minPrice: '', maxPrice: '', discount: 'All' });
        navigate(search ? `/?search=${encodeURIComponent(search)}` : '/');
    };

    return (
        <div className="container-fluid mt-4 mb-5 home-shell">
            {search && (
                <div className="alert alert-light border shadow-sm mb-4 d-flex justify-content-between align-items-center">
                    <h5 className="m-0 text-muted">
                        Showing results for: <span className="text-dark fw-bold">"{search}"</span>
                    </h5>
                    <Link to={search ? `/?search=${encodeURIComponent(search)}` : "/"} className="btn btn-sm btn-outline-secondary rounded-pill">
                        View All
                    </Link>
                </div>
            )}

            <div className="row g-4 align-items-start">
                <div className="col-lg-3">
                    <div className="filter-panel shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0 fw-bold">Filters</h5>
                            <button type="button" className="btn btn-sm btn-link text-decoration-none px-0" onClick={handleReset}>
                                Reset
                            </button>
                        </div>

                        <form onSubmit={handleApplyFilters}>
                            <div className="mb-3">
                                <label className="form-label fw-semibold small text-uppercase text-muted">Category</label>
                                <select
                                    className="form-select"
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                >
                                    <option value="All">All Categories</option>
                                    {CATEGORY_OPTIONS.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold small text-uppercase text-muted">Price Range</label>
                                <div className="d-flex gap-2">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Min"
                                        value={filters.minPrice}
                                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold small text-uppercase text-muted d-block">Discount</label>
                                <div className="d-flex flex-wrap gap-2">
                                    <button type="button" className={`filter-chip ${filters.discount === 'All' ? 'active' : ''}`} onClick={() => setFilters((prev) => ({ ...prev, discount: 'All' }))}>
                                        All
                                    </button>
                                    {DISCOUNT_OPTIONS.map((discount) => (
                                        <button
                                            key={discount}
                                            type="button"
                                            className={`filter-chip ${filters.discount === String(discount) ? 'active' : ''}`}
                                            onClick={() => handleFilterChange('discount', String(discount))}
                                        >
                                            {discount}%+
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-dark w-100 rounded-pill mb-2">
                                Apply Filters
                            </button>
                        </form>

                        <div className="mt-4 pt-3 border-top">
                            <h6 className="fw-bold mb-2">Quick Picks</h6>
                            <div className="d-grid gap-2">
                                {CATEGORY_OPTIONS.slice(0, 4).map((category) => (
                                    <button key={category} type="button" className="btn btn-outline-secondary btn-sm text-start" onClick={() => handleQuickCategory(category)}>
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-9">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <div>
                            <h2 className="fw-bold mb-1">All Products</h2>
                            {querySummary.length > 0 && (
                                <div className="filter-summary text-muted small">
                                    {querySummary.join(' • ')}
                                </div>
                            )}
                        </div>
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                            {user && user.role === 'admin' && (
                                <Link to="/products/new" className="btn btn-primary rounded-pill px-4">
                                    Add Product
                                </Link>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">No products found</p>
                        </div>
                    ) : (
                        <div className="row row-cols-lg-4 row-cols-md-3 row-cols-sm-2 row-cols-1 g-4">
                            {products.map((product) => (
                                <div key={product._id} className="col">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;

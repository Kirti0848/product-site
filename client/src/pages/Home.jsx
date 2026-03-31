import { useContext, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { AuthContext } from '../context/AuthContext';
import { API } from '../services/api';
import './Home.css';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const search = searchParams.get('search') || '';
                const response = await API.getProducts(search);
                setProducts(response.data.products || []);
            } catch (err) {
                console.error('Failed to fetch products:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [searchParams]);

    const search = searchParams.get('search');

    return (
        <div className="container mt-4 mb-5">
            {search && (
                <div className="alert alert-light border shadow-sm mb-4 d-flex justify-content-between align-items-center">
                    <h5 className="m-0 text-muted">
                        Showing results for: <span className="text-dark fw-bold">"{search}"</span>
                    </h5>
                    <Link to="/" className="btn btn-sm btn-outline-secondary rounded-pill">
                        View All
                    </Link>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">All Products</h2>
                {user && user.role === 'admin' && (
                    <Link to="/products/new" className="btn btn-primary rounded-pill px-4">
                        Add Product
                    </Link>
                )}
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
                    {products.map(product => (
                        <div key={product._id} className="col">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;

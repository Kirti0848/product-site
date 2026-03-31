import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API } from '../services/api';

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        availability: 'In Stock',
        description: '',
        image: null
    });
    const [currentImage, setCurrentImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await API.getProduct(id);
                const product = response.data;
                setFormData({
                    title: product.title,
                    price: product.price,
                    availability: product.availability,
                    description: product.description,
                    image: null
                });
                setCurrentImage(product.image);
            } catch (err) {
                console.error('Failed to fetch product:', err);
                setError('Error loading product');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (user && user.role !== 'admin') {
        return (
            <div className="alert alert-danger mt-5">
                <p>Access Denied: Only admins can edit products</p>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        setFormData(prev => ({
            ...prev,
            image: e.target.files[0]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const data = new FormData();
            data.append('product[title]', formData.title);
            data.append('product[price]', formData.price);
            data.append('product[availability]', formData.availability);
            data.append('product[description]', formData.description);
            if (formData.image) {
                data.append('product[image]', formData.image);
            }

            await API.updateProduct(id, data);
            navigate(`/products/${id}`);
        } catch (err) {
            console.error('Failed to update product:', err);
            setError('Error updating product. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="row mt-3 mb-5">
            <div className="col-8 offset-2">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold m-0">Edit Product</h2>
                    <Link to="/" className="btn btn-outline-secondary rounded-pill px-4">
                        ← Back to Home
                    </Link>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="card p-4 shadow-sm border-0" style={{ borderRadius: '15px' }}>
                    <form onSubmit={handleSubmit} encType="multipart/form-data">

                        <div className="mb-3">
                            <label className="form-label fw-bold">Title</label>
                            <input
                                type="text"
                                name="title"
                                className="form-control"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold d-block">Current Image</label>
                            <img
                                src={currentImage}
                                className="img-thumbnail shadow-sm mb-2"
                                style={{
                                    width: '200px',
                                    height: '150px',
                                    objectFit: 'cover',
                                    borderRadius: '10px'
                                }}
                                alt="Current Product"
                            />
                            <p className="text-muted small"></p>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold text-primary">
                                Upload New Image (Optional)
                            </label>
                            <input
                                type="file"
                                name="image"
                                className="form-control border-primary"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="row">
                            <div className="mb-3 col-md-6">
                                <label className="form-label fw-bold">Price (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    className="form-control"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="mb-3 col-md-6">
                                <label className="form-label fw-bold">Availability</label>
                                <select
                                    name="availability"
                                    className="form-select"
                                    value={formData.availability}
                                    onChange={handleChange}
                                >
                                    <option value="In Stock">In Stock</option>
                                    <option value="Low Stock">Low Stock</option>
                                    <option value="Out of Stock">Out of Stock</option>
                                </select>
                            </div>
                        </div>

                        <div className="d-grid mt-4">
                            <button
                                type="submit"
                                className="btn btn-dark btn-lg rounded-pill shadow"
                                disabled={submitting}
                            >
                                {submitting ? 'Updating...' : 'Update & Go to Home'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProduct;

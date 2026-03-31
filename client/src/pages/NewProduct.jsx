import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API } from '../services/api';

const NewProduct = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        title: '',
        brand: '',
        category: '',
        price: '',
        availability: 'In Stock',
        description: '',
        image: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (user && user.role !== 'admin') {
        return (
            <div className="alert alert-danger mt-5">
                <p>Access Denied: Only admins can create products</p>
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
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            data.append('product[title]', formData.title);
            data.append('product[brand]', formData.brand);
            data.append('product[category]', formData.category);
            data.append('product[price]', formData.price);
            data.append('product[availability]', formData.availability);
            data.append('product[description]', formData.description);
            if (formData.image) {
                data.append('product[image]', formData.image);
            }

            await API.createProduct(data);
            navigate('/');
        } catch (err) {
            console.error('Failed to create product:', err);
            setError('Error creating product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row mt-3 mb-5">
            <div className="col-8 offset-2">
                <h2 className="fw-bold mb-4">Add a New Product</h2>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit} encType="multipart/form-data" className="needs-validation">

                    <div className="mb-3">
                        <label className="form-label fw-bold">Title</label>
                        <input
                            type="text"
                            name="title"
                            className="form-control"
                            placeholder="e.g. Samsung Galaxy S21"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="row">
                        <div className="mb-3 col-md-6">
                            <label className="form-label fw-bold">Brand</label>
                            <input
                                type="text"
                                name="brand"
                                className="form-control"
                                placeholder="e.g. Samsung"
                                value={formData.brand}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3 col-md-6">
                            <label className="form-label fw-bold">Category</label>
                            <input
                                type="text"
                                name="category"
                                className="form-control"
                                placeholder="e.g. Electronics"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="mb-3 col-md-6">
                            <label className="form-label fw-bold">Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                className="form-control"
                                placeholder="999"
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

                    <div className="mb-3">
                        <label className="form-label fw-bold">Description</label>
                        <textarea
                            name="description"
                            className="form-control"
                            rows="3"
                            placeholder="Short product description..."
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold">Upload Product Image</label>
                        <input
                            type="file"
                            name="image"
                            className="form-control"
                            onChange={handleImageChange}
                            required
                        />
                    </div>

                    <div className="d-grid">
                        <button
                            type="submit"
                            className="btn btn-dark btn-lg rounded-pill"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProduct;

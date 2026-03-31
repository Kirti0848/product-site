import axios from 'axios';

// Backend ka poora URL
const API_BASE = 'http://localhost:8081/api'; 
const AUTH_BASE = 'http://localhost:8081'; // Auth routes aksar /api ke bina hote hain

const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true // Cookies/Session ke liye zaroori hai
});

export const API = {
    // Products
    getProducts: (search = '') => 
        apiClient.get('/products', { params: { search } }),
    
    getProduct: (id) => 
        apiClient.get(`/products/${id}`),
    
    createProduct: (formData) => 
        apiClient.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    
    updateProduct: (id, formData) => 
        apiClient.put(`/products/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    
    deleteProduct: (id) => 
        apiClient.delete(`/products/${id}`),

    // Cart (Inke aage /api automatically lag jayega baseURL se)
    addToCart: (productId, quantity = 1) => 
        apiClient.post(`/cart/add/${productId}`, { quantity }),
    
    getCart: () => 
        apiClient.get('/cart'),
    
    removeFromCart: (itemId) => 
        apiClient.delete(`/cart/${itemId}`),
    
    updateCartQuantity: (itemId, change) => 
        apiClient.patch(`/cart/${itemId}/update`, { change }),

    // Checkout & Payment
    checkout: () => 
        apiClient.post('/checkout'),
    
    verifyPayment: (paymentData) => 
        apiClient.post('/payment/verify', paymentData),

    // Auth (Inme baseURL use nahi hoga kyunki ye /api ke bahar ho sakte hain)
    signup: (userData) => 
        axios.post(`${AUTH_BASE}/signup`, userData, { withCredentials: true }),
    
    login: (credentials) => 
        axios.post(`${AUTH_BASE}/login`, credentials, { withCredentials: true }),
    
    logout: () => 
        axios.get(`${AUTH_BASE}/logout`, { withCredentials: true }),
    
    checkAuth: () => 
        apiClient.get('/auth/profile') // Ye AuthContext ke liye hai
};

export default apiClient;
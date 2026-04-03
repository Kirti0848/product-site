import axios from 'axios';

// Vite mein process.env ki jagah import.meta.env use hota hai
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8081') + '/api'; 
const AUTH_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081'; 

const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true 
});

export const API = {
    // Products
    getProducts: (params = {}) =>
        apiClient.get('/products', {
            params: typeof params === 'string' ? { search: params } : params
        }),
    
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
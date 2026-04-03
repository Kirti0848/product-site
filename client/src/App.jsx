import 'bootstrap/dist/css/bootstrap.min.css';
import { useContext } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Cart from './pages/Cart';
import EditProduct from './pages/EditProduct';
import Home from './pages/Home';
import Login from './pages/Login';
import NewProduct from './pages/NewProduct';
import Orders from './pages/Orders';
import Show from './pages/Show';
import Signup from './pages/Signup';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return (
            <div className="alert alert-danger mt-5">
                <p>Access Denied</p>
            </div>
        );
    }

    return children;
};

const AppRoutes = () => {
    const { loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products/:id" element={<Show />} />
                <Route
                    path="/products/new"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <NewProduct />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products/:id/edit"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <EditProduct />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cart"
                    element={
                        <ProtectedRoute>
                            <Cart />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Layout>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;

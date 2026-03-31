import { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

// Backend ka address (Make sure your backend is running on 8081)
const API_BASE_URL = 'http://localhost:8081'; 

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    credentials: 'include'
                });

                // Check if the response is JSON before parsing
                const contentType = response.headers.get("content-type");
                if (response.ok && contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    setUser(data);
                } else {
                    // Agar backend ne HTML bheja (like <!doctype), toh hum yahan aayenge
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const logout = async () => {
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'GET',
                credentials: 'include'
            });
            setUser(null);
            window.location.href = "/login"; // Logout ke baad login page par bhej dein
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
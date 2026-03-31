import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="container-fluid px-4 mt-4 flex-grow-1">
                {children}
            </main>
            <footer className="bg-dark text-white py-4 mt-5">
                <div className="container text-center">
                    <p className="mb-0">&copy; 2025 ProductPro. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;

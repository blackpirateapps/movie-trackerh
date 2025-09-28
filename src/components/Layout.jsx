import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <>
            <Navbar />
            <main className="container mx-auto max-w-5xl p-4">
                <Outlet />
            </main>
        </>
    );
};

export default Layout;

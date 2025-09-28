import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="pt-20">
        {children}
      </main>
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary-900/10 via-transparent to-purple-900/10" />
    </div>
  );
};

export default Layout;
import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
      <div className="bg-gradient"></div>
    </div>
  );
};

export default Layout;
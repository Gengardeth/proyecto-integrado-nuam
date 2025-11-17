import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Topbar from './Topbar';
import './Layout.css';

/**
 * Layout principal con Sidebar y Topbar para páginas autenticadas
 */
const Layout = () => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Topbar />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

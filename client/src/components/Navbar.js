import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { 
      path: '/', 
      name: 'Dashboard', 
      icon: '🏠' 
    },
    { 
      path: '/productos', 
      name: 'Productos', 
      icon: '📦' 
    },
    { 
      path: '/clientes', 
      name: 'Clientes', 
      icon: '👥' 
    },
    { 
      path: '/ventas', 
      name: 'Ventas', 
      icon: '💰' 
    },
    { 
      path: '/reportes', 
      name: 'Reportes', 
      icon: '📊' 
    }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>🏪 Tienda de Barrio</h2>
      </div>
      
      <ul className="navbar-nav">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="navbar-user">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="user-name">Administrador</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
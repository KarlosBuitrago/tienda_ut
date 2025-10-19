import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalClientes: 0,
    ventasHoy: 0,
    stockBajo: 0
  });

  useEffect(() => {
    // Cargar estadísticas del dashboard
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Obtener productos
      const productosResponse = await fetch('http://localhost:3006/api/productos');
      const productos = await productosResponse.json();
      
      // Obtener clientes
      const clientesResponse = await fetch('http://localhost:3006/api/clientes');
      const clientes = await clientesResponse.json();

      // Calcular stock bajo (menos de 10 unidades)
      const stockBajo = productos.filter(p => p.stock < 10).length;

      setStats({
        totalProductos: productos.length,
        totalClientes: clientes.length,
        ventasHoy: 0, // Por implementar cuando tengamos ventas
        stockBajo
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const dashboardCards = [
    {
      title: 'Total Productos',
      value: stats.totalProductos,
      icon: '📦',
      color: 'blue',
      link: '/productos'
    },
    {
      title: 'Total Clientes',
      value: stats.totalClientes,
      icon: '👥',
      color: 'green',
      link: '/clientes'
    },
    {
      title: 'Ventas Hoy',
      value: `$${stats.ventasHoy.toLocaleString()}`,
      icon: '💰',
      color: 'orange',
      link: '/ventas'
    },
    {
      title: 'Stock Bajo',
      value: stats.stockBajo,
      icon: '⚠️',
      color: 'red',
      link: '/productos'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Panel de Control</h1>
        <p className="dashboard-subtitle">
          Resumen general de tu tienda de barrio
        </p>
      </div>

      <div className="dashboard-cards">
        {dashboardCards.map((card, index) => (
          <Link 
            key={index} 
            to={card.link} 
            className={`dashboard-card ${card.color}`}
          >
            <div className="card-icon">
              {card.icon}
            </div>
            <div className="card-content">
              <h3 className="card-title">{card.title}</h3>
              <p className="card-value">{card.value}</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>
        ))}
      </div>

      <div className="dashboard-actions">
        <h2>Acciones Rápidas</h2>
        <div className="action-buttons">
          <Link to="/productos" className="action-btn primary">
            <span className="btn-icon">➕</span>
            <span>Agregar Producto</span>
          </Link>
          <Link to="/clientes" className="action-btn secondary">
            <span className="btn-icon">👤</span>
            <span>Nuevo Cliente</span>
          </Link>
          <Link to="/ventas" className="action-btn success">
            <span className="btn-icon">🛒</span>
            <span>Nueva Venta</span>
          </Link>
          <Link to="/reportes" className="action-btn info">
            <span className="btn-icon">📊</span>
            <span>Ver Reportes</span>
          </Link>
        </div>
      </div>

      <div className="dashboard-recent">
        <div className="recent-section">
          <h3>Productos con Stock Bajo</h3>
          <div className="recent-placeholder">
            <p>Los productos con stock menor a 10 unidades aparecerán aquí</p>
          </div>
        </div>
        
        <div className="recent-section">
          <h3>Últimas Ventas</h3>
          <div className="recent-placeholder">
            <p>Las ventas recientes aparecerán aquí cuando implementes el módulo de ventas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
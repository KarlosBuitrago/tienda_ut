// ================================================
// 🎨 EJEMPLOS DE CÓDIGO PARA ACTUALIZAR FRONTEND
// ================================================

// ============================================
// 1. DASHBOARD.JS - Agregar nuevas métricas
// ============================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalClientes: 0,
    ventasHoy: 0,
    stockBajo: 0,
    ventasTotal: 0,
    utilidadTotal: 0,        // 🆕 NUEVO - Del DW
    margenPromedio: 0         // 🆕 NUEVO - Del DW
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // 🔥 Ahora este endpoint consulta el DW
      const response = await fetch('http://localhost:3006/api/reportes/dashboard');
      const data = await response.json();
      
      setStats({
        totalProductos: data.productosEnStock || 0,
        totalClientes: data.totalClientes || 0,
        ventasHoy: data.ventas_hoy || 0,
        stockBajo: data.productosBajoStock || 0,
        ventasTotal: data.ventasTotal || 0,
        utilidadTotal: data.utilidadTotal || 0,     // 🆕 NUEVO
        margenPromedio: data.margenPromedio || 0     // 🆕 NUEVO
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
      title: 'Ventas Totales',
      value: `$${stats.ventasTotal.toLocaleString()}`,
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
    },
    // 🆕 NUEVAS MÉTRICAS DEL DW
    {
      title: 'Utilidad Total',
      value: `$${stats.utilidadTotal.toLocaleString()}`,
      icon: '💵',
      color: 'purple',
      link: '/reportes',
      isNew: true  // Flag para resaltar
    },
    {
      title: 'Margen Promedio',
      value: `${stats.margenPromedio.toFixed(2)}%`,
      icon: '📊',
      color: 'indigo',
      link: '/reportes',
      isNew: true
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
            className={`dashboard-card ${card.color} ${card.isNew ? 'new-metric' : ''}`}
          >
            <div className="card-icon">
              {card.icon}
              {card.isNew && <span className="badge-new">NUEVO</span>}
            </div>
            <div className="card-content">
              <h3 className="card-title">{card.title}</h3>
              <p className="card-value">{card.value}</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>
        ))}
      </div>

      {/* Resto del componente... */}
    </div>
  );
};

export default Dashboard;


// ============================================
// 2. REPORTES PAGE - Top Clientes Mejorado
// ============================================

const TopClientesReport = () => {
  const [clientes, setClientes] = useState([]);
  const [filtroSegmento, setFiltroSegmento] = useState('');
  const [limite, setLimite] = useState(10);

  useEffect(() => {
    loadTopClientes();
  }, [limite]);

  const loadTopClientes = async () => {
    try {
      const response = await fetch(
        `http://localhost:3006/api/reportes/top-clientes?limite=${limite}`
      );
      const data = await response.json();
      setClientes(data.clientes || []);
    } catch (error) {
      console.error('Error al cargar top clientes:', error);
    }
  };

  // 🆕 Filtrar por segmento (nueva funcionalidad del DW)
  const clientesFiltrados = filtroSegmento
    ? clientes.filter(c => c.segmento_cliente === filtroSegmento)
    : clientes;

  return (
    <div className="report-section">
      <h2>👥 Top Clientes</h2>
      
      {/* 🆕 Filtro por segmento */}
      <div className="filters">
        <select 
          value={filtroSegmento} 
          onChange={(e) => setFiltroSegmento(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los segmentos</option>
          <option value="VIP">VIP</option>
          <option value="Regular">Regular</option>
          <option value="Nuevo">Nuevo</option>
        </select>

        <select 
          value={limite} 
          onChange={(e) => setLimite(Number(e.target.value))}
          className="filter-select"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
        </select>
      </div>

      <div className="clients-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Documento</th>
              <th>📍 Ubicación</th>
              <th>🏷️ Segmento</th> {/* 🆕 NUEVO */}
              <th>👤 Edad</th> {/* 🆕 NUEVO */}
              <th>💰 Total Compras</th>
              <th>📊 Utilidad Generada</th> {/* 🆕 NUEVO */}
              <th>🔢 # Ventas</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((cliente, index) => (
              <tr key={cliente.id}>
                <td>{index + 1}</td>
                <td className="client-name">{cliente.nombre_cliente}</td>
                <td>{cliente.numero_documento}</td>
                <td>
                  {cliente.municipio}
                  {/* 🆕 Mostrar departamento del DW */}
                  {cliente.departamento && (
                    <span className="text-muted"> ({cliente.departamento})</span>
                  )}
                </td>
                {/* 🆕 Badge de segmento con colores */}
                <td>
                  <span className={`badge badge-${cliente.segmento_cliente?.toLowerCase()}`}>
                    {cliente.segmento_cliente || 'Regular'}
                  </span>
                </td>
                {/* 🆕 Rango de edad */}
                <td>{cliente.rango_edad || 'N/A'}</td>
                <td className="amount">
                  ${Number(cliente.total_compras).toLocaleString()}
                </td>
                {/* 🆕 Utilidad generada */}
                <td className="amount profit">
                  ${Number(cliente.utilidad_generada || 0).toLocaleString()}
                </td>
                <td>{cliente.numero_ventas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🆕 Resumen del segmento */}
      {filtroSegmento && (
        <div className="segment-summary">
          <h4>Resumen - Clientes {filtroSegmento}</h4>
          <div className="summary-cards">
            <div className="summary-card">
              <span>Total Clientes:</span>
              <strong>{clientesFiltrados.length}</strong>
            </div>
            <div className="summary-card">
              <span>Ventas Totales:</span>
              <strong>
                ${clientesFiltrados.reduce((sum, c) => sum + Number(c.total_compras), 0).toLocaleString()}
              </strong>
            </div>
            <div className="summary-card">
              <span>Utilidad Total:</span>
              <strong>
                ${clientesFiltrados.reduce((sum, c) => sum + Number(c.utilidad_generada || 0), 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ============================================
// 3. CSS PARA NUEVAS MÉTRICAS
// ============================================

/*
Agregar a Dashboard.css o ReportesPage.css:
*/

/* Resaltar métricas nuevas */
.dashboard-card.new-metric {
  position: relative;
  animation: pulse 2s infinite;
}

.badge-new {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4444;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
}

/* Colores para segmentos de clientes */
.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-vip {
  background: #ffd700;
  color: #000;
}

.badge-regular {
  background: #4CAF50;
  color: white;
}

.badge-nuevo {
  background: #2196F3;
  color: white;
}

/* Utilidad en verde */
.amount.profit {
  color: #4CAF50;
  font-weight: 600;
}

/* Filtros */
.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

/* Resumen de segmento */
.segment-summary {
  margin-top: 30px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 12px;
}

.summary-cards {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

.summary-card {
  flex: 1;
  padding: 15px;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-card strong {
  font-size: 24px;
  color: #4CAF50;
}

/* Card de color púrpura */
.dashboard-card.purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dashboard-card.indigo {
  background: linear-gradient(135deg, #5f72bd 0%, #9921e8 100%);
}

/* Animación pulse */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}


// ============================================
// 4. EJEMPLO COMPLETO - PÁGINA DE RENTABILIDAD
// ============================================

import React, { useState, useEffect } from 'react';
import './ReportesPage.css';

const RentabilidadReport = () => {
  const [productos, setProductos] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    ordenar: 'ganancia_total' // ganancia_total, margen_promedio_real
  });

  useEffect(() => {
    loadRentabilidad();
  }, [filtros]);

  const loadRentabilidad = async () => {
    try {
      let url = 'http://localhost:3006/api/reportes/rentabilidad';
      const params = new URLSearchParams();
      
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      
      const response = await fetch(`${url}?${params}`);
      const data = await response.json();
      
      let productosOrdenados = data.productos || [];
      
      // Ordenar según criterio
      if (filtros.ordenar === 'margen_promedio_real') {
        productosOrdenados.sort((a, b) => b.margen_promedio_real - a.margen_promedio_real);
      }
      
      setProductos(productosOrdenados);
    } catch (error) {
      console.error('Error al cargar rentabilidad:', error);
    }
  };

  return (
    <div className="report-section">
      <h2>💰 Análisis de Rentabilidad</h2>
      
      {/* Filtros */}
      <div className="filters-row">
        <div className="filter-group">
          <label>Desde:</label>
          <input 
            type="date" 
            value={filtros.fechaInicio}
            onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Hasta:</label>
          <input 
            type="date" 
            value={filtros.fechaFin}
            onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Ordenar por:</label>
          <select 
            value={filtros.ordenar}
            onChange={(e) => setFiltros({...filtros, ordenar: e.target.value})}
          >
            <option value="ganancia_total">Ganancia Total</option>
            <option value="margen_promedio_real">Margen %</option>
          </select>
        </div>
      </div>

      {/* Resumen General */}
      <div className="summary-cards">
        <div className="summary-card">
          <h4>Ingresos Totales</h4>
          <p className="big-number">
            ${productos.reduce((sum, p) => sum + Number(p.ingresos_totales), 0).toLocaleString()}
          </p>
        </div>
        <div className="summary-card green">
          <h4>Ganancia Total</h4>
          <p className="big-number">
            ${productos.reduce((sum, p) => sum + Number(p.ganancia_total), 0).toLocaleString()}
          </p>
        </div>
        <div className="summary-card blue">
          <h4>Margen Promedio</h4>
          <p className="big-number">
            {(productos.reduce((sum, p) => sum + Number(p.margen_promedio_real), 0) / productos.length).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Tabla de Productos */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Precio</th>
            <th>Costo</th>
            <th>Margen $</th>
            <th>Margen %</th>
            <th>Unidades</th>
            <th>Ingresos</th>
            <th>Costos</th>
            <th>💰 Ganancia</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <tr key={producto.codigo_producto}>
              <td className="product-name">{producto.nombre_producto}</td>
              <td>{producto.tipo_producto}</td>
              <td>${Number(producto.precio_venta).toLocaleString()}</td>
              <td>${Number(producto.costo).toLocaleString()}</td>
              <td className="profit">${Number(producto.margen_pesos).toLocaleString()}</td>
              <td>
                <span className={`badge ${producto.margen_promedio_real > 30 ? 'success' : 'warning'}`}>
                  {Number(producto.margen_promedio_real).toFixed(2)}%
                </span>
              </td>
              <td>{producto.unidades_vendidas}</td>
              <td>${Number(producto.ingresos_totales).toLocaleString()}</td>
              <td className="cost">${Number(producto.costos_totales).toLocaleString()}</td>
              <td className="profit-big">
                ${Number(producto.ganancia_total).toLocaleString()}
              </td>
              <td>{producto.stock_actual}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RentabilidadReport;

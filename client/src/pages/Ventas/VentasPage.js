import React, { useState, useEffect } from 'react';
import { ventasService } from '../../services/ventasService';
import NuevaVenta from './NuevaVenta';
import DetalleVenta from './DetalleVenta';
import './VentasPage.css';

const VentasPage = () => {
  const [ventas, setVentas] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('lista'); // 'lista', 'nueva', 'detalle'
  const [selectedVenta, setSelectedVenta] = useState(null);

  useEffect(() => {
    loadVentas();
    loadStats();
  }, []);

  const loadVentas = async () => {
    try {
      console.log('🔄 Cargando ventas...');
      const data = await ventasService.getAll();
      console.log('✅ Ventas cargadas:', data);
      setVentas(data);
    } catch (error) {
      console.error('❌ Error al cargar ventas:', error);
      alert('Error al cargar las ventas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 Cargando estadísticas...');
      const data = await ventasService.getStats();
      console.log('✅ Estadísticas cargadas:', data);
      setStats(data);
    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
    }
  };

  const handleVentaCreated = () => {
    loadVentas();
    loadStats();
    setView('lista');
  };

  const handleVerDetalle = async (numero_venta) => {
    try {
      const venta = await ventasService.getById(numero_venta);
      setSelectedVenta(venta);
      setView('detalle');
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      alert('Error al obtener detalle de la venta');
    }
  };

  const handleCancelarVenta = async (numero_venta) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta venta? Se restaurará el stock.')) {
      try {
        await ventasService.delete(numero_venta);
        alert('Venta cancelada exitosamente');
        loadVentas();
        loadStats();
      } catch (error) {
        console.error('Error al cancelar venta:', error);
        alert('Error al cancelar la venta: ' + error.message);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CO');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="ventas-page">
        <div className="loading">Cargando ventas...</div>
      </div>
    );
  }

  return (
    <div className="ventas-page">
      <div className="page-header">
        <h1>💰 Sistema de Ventas</h1>
        <p className="page-subtitle">Gestiona las ventas y transacciones de tu tienda</p>
      </div>

      {view === 'lista' && (
        <>
          {/* Estadísticas */}
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total Ventas</h3>
                <p className="stat-value">{stats.total_ventas || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <h3>Ingresos Totales</h3>
                <p className="stat-value">{formatCurrency(stats.total_ingresos || 0)}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>Promedio por Venta</h3>
                <p className="stat-value">{formatCurrency(stats.promedio_venta || 0)}</p>
              </div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>Ventas Hoy</h3>
                <p className="stat-value">{stats.ventas_hoy || 0}</p>
                <small>{formatCurrency(stats.ingresos_hoy || 0)}</small>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="actions-bar">
            <button 
              className="btn btn-primary btn-large"
              onClick={() => setView('nueva')}
            >
              🛒 Nueva Venta
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                loadVentas();
                loadStats();
              }}
            >
              🔄 Actualizar
            </button>
          </div>

          {/* Lista de Ventas */}
          <div className="ventas-table-container">
            <div className="table-header">
              <h2>📋 Historial de Ventas ({ventas.length})</h2>
            </div>
            
            {ventas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛒</div>
                <div className="empty-state-text">No hay ventas registradas</div>
                <div className="empty-state-subtext">Realiza tu primera venta para comenzar</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="ventas-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Documento</th>
                      <th>Tipo Venta</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((venta) => (
                      <tr key={venta.numero_venta}>
                        <td>
                          <strong>#{venta.numero_venta}</strong>
                        </td>
                        <td>
                          <div className="fecha-info">
                            {formatDate(venta.fecha_venta)}
                          </div>
                        </td>
                        <td>
                          <div className="cliente-info">
                            <strong>{venta.nombre_cliente || 'Cliente No Registrado'}</strong>
                          </div>
                        </td>
                        <td>{venta.numero_documento || 'N/A'}</td>
                        <td>
                          <span className={`tipo-venta ${venta.tipo_venta}`}>
                            {venta.tipo_venta.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="items-count">
                            {venta.total_items} items
                          </span>
                        </td>
                        <td>
                          <span className="total-amount">
                            {formatCurrency(venta.total_venta)}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button 
                              onClick={() => handleVerDetalle(venta.numero_venta)}
                              className="btn btn-table btn-info"
                              title="Ver detalle"
                            >
                              👁️ Ver
                            </button>
                            <button 
                              onClick={() => handleCancelarVenta(venta.numero_venta)}
                              className="btn btn-table btn-delete"
                              title="Cancelar venta"
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'nueva' && (
        <div className="nueva-venta-container">
          <div className="form-header">
            <h2>🛒 Nueva Venta</h2>
            <button 
              className="btn btn-secondary"
              onClick={() => setView('lista')}
            >
              ← Volver a Lista
            </button>
          </div>
          <NuevaVenta onVentaCreated={handleVentaCreated} />
        </div>
      )}

      {view === 'detalle' && selectedVenta && (
        <div className="detalle-venta-container">
          <div className="form-header">
            <h2>📋 Detalle de Venta #{selectedVenta.numero_venta}</h2>
            <button 
              className="btn btn-secondary"
              onClick={() => setView('lista')}
            >
              ← Volver a Lista
            </button>
          </div>
          <DetalleVenta venta={selectedVenta} />
        </div>
      )}
    </div>
  );
};

export default VentasPage;
import React, { useState, useEffect } from 'react';
import { ventasService } from '../../services/ventasService';

const DetalleVenta = ({ ventaId, onVolver }) => {
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadVentaDetalle = async () => {
      try {
        setLoading(true);
        setError(null);
        const ventaData = await ventasService.getById(ventaId);
        setVenta(ventaData);
      } catch (err) {
        console.error('Error al cargar detalle de venta:', err);
        setError('Error al cargar los detalles de la venta');
      } finally {
        setLoading(false);
      }
    };
    
    if (ventaId) {
      loadVentaDetalle();
    }
  }, [ventaId]);

  const eliminarVenta = async () => {
    try {
      setLoading(true);
      await ventasService.delete(ventaId);
      alert('Venta eliminada correctamente');
      onVolver();
    } catch (err) {
      console.error('Error al eliminar venta:', err);
      alert('Error al eliminar la venta: ' + err.message);
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTotalVenta = () => {
    if (!venta?.detalles) return 0;
    return venta.detalles.reduce((sum, detalle) => 
      sum + (detalle.cantidad * detalle.precio_unitario), 0
    );
  };

  const calcularTotalPagos = () => {
    if (!venta?.pagos) return 0;
    return venta.pagos.reduce((sum, pago) => sum + pago.monto, 0);
  };

  if (loading) {
    return (
      <div className="detalle-venta loading">
        <div className="loading-spinner">Cargando detalles de la venta...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detalle-venta error">
        <div className="error-message">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={onVolver}>
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="detalle-venta error">
        <div className="error-message">
          <h3>❌ Venta no encontrada</h3>
          <button className="btn btn-primary" onClick={onVolver}>
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  const totalVenta = calcularTotalVenta();
  const totalPagos = calcularTotalPagos();
  const saldoPendiente = totalVenta - totalPagos;

  return (
    <div className="detalle-venta">
      {/* Header */}
      <div className="detalle-header">
        <button className="btn btn-secondary" onClick={onVolver}>
          ← Volver
        </button>
        <h2>Detalle de Venta #{venta.numero_venta}</h2>
        <div className="header-actions">
          <button 
            className="btn btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑️ Eliminar Venta
          </button>
        </div>
      </div>

      {/* Información General */}
      <div className="venta-info-card">
        <h3>📋 Información General</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Número de Venta:</label>
            <span className="numero-venta">#{venta.numero_venta}</span>
          </div>
          <div className="info-item">
            <label>Fecha:</label>
            <span>{formatearFecha(venta.fecha_venta)}</span>
          </div>
          <div className="info-item">
            <label>Tipo de Venta:</label>
            <span className={`tipo-venta ${venta.tipo_venta}`}>
              {venta.tipo_venta.toUpperCase()}
            </span>
          </div>
          <div className="info-item">
            <label>Estado:</label>
            <span className={`estado ${saldoPendiente > 0 ? 'pendiente' : 'pagado'}`}>
              {saldoPendiente > 0 ? 'PENDIENTE' : 'PAGADO'}
            </span>
          </div>
        </div>
      </div>

      {/* Información del Cliente */}
      <div className="cliente-info-card">
        <h3>👤 Cliente</h3>
        <div className="cliente-detalle">
          <div className="cliente-nombre">
            <strong>{venta.cliente?.nombre_cliente || 'Cliente no disponible'}</strong>
          </div>
          <div className="cliente-datos">
            <p><strong>Documento:</strong> {venta.cliente?.numero_documento}</p>
            <p><strong>Dirección:</strong> {venta.cliente?.direccion_cliente}</p>
            <p><strong>Teléfono:</strong> {venta.cliente?.telefono_cliente}</p>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="productos-card">
        <h3>📦 Productos Vendidos</h3>
        <div className="productos-tabla">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Precio Unit.</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.detalles?.map((detalle, index) => (
                <tr key={index}>
                  <td>{detalle.codigo_producto}</td>
                  <td>{detalle.producto?.nombre_producto || 'Producto no disponible'}</td>
                  <td>${detalle.precio_unitario.toFixed(2)}</td>
                  <td>{detalle.cantidad}</td>
                  <td>${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagos */}
      <div className="pagos-card">
        <h3>💰 Pagos Realizados</h3>
        {venta.pagos && venta.pagos.length > 0 ? (
          <div className="pagos-tabla">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Medio de Pago</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {venta.pagos.map((pago, index) => (
                  <tr key={index}>
                    <td>{formatearFecha(pago.fecha_pago)}</td>
                    <td>{pago.medio_pago?.nombre_medio_pago || 'No disponible'}</td>
                    <td>${pago.monto.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-pagos">
            <p>No se han registrado pagos para esta venta</p>
          </div>
        )}
      </div>

      {/* Resumen Financiero */}
      <div className="resumen-card">
        <h3>📊 Resumen Financiero</h3>
        <div className="resumen-financiero">
          <div className="resumen-linea">
            <span>Total de la Venta:</span>
            <strong>${totalVenta.toFixed(2)}</strong>
          </div>
          <div className="resumen-linea">
            <span>Total Pagado:</span>
            <strong>${totalPagos.toFixed(2)}</strong>
          </div>
          <div className={`resumen-linea ${saldoPendiente > 0 ? 'pendiente' : 'completo'}`}>
            <span>Saldo Pendiente:</span>
            <strong>${saldoPendiente.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ Confirmar Eliminación</h3>
            <p>
              ¿Estás seguro de que deseas eliminar la venta #{venta.numero_venta}?
              <br />
              <strong>Esta acción restaurará el stock de los productos y no se puede deshacer.</strong>
            </p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={eliminarVenta}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleVenta;
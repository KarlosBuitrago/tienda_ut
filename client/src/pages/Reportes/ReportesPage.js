import React, { useState, useEffect, useCallback } from 'react';
import { reportesService } from '../../services/reportesService';
import './ReportesPage.css';

const ReportesPage = () => {
  const [reporteActivo, setReporteActivo] = useState('dashboard');
  const [reporteData, setReporteData] = useState({});
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    cliente: '',
    producto: '',
    municipio: '',
    stockMinimo: 10
  });

  const reportes = [
    {
      id: 'dashboard',
      titulo: '📊 Dashboard General',
      descripcion: 'Resumen ejecutivo de la tienda'
    },
    {
      id: 'inventario-bajo',
      titulo: '⚠️ Stock Bajo',
      descripcion: 'Productos con inventario bajo'
    },
    {
      id: 'productos-vencimiento',
      titulo: '📅 Próximos a Vencer',
      descripcion: 'Productos próximos a fecha de vencimiento'
    },
    {
      id: 'faltantes',
      titulo: '🚫 Productos Faltantes',
      descripcion: 'Productos sin stock disponible'
    },
    {
      id: 'top-clientes',
      titulo: '👥 Top Clientes',
      descripcion: 'Clientes que más compran'
    },
    {
      id: 'top-productos',
      titulo: '📦 Productos Más Vendidos',
      descripcion: 'Productos con mayor rotación'
    },
    {
      id: 'ventas-municipio',
      titulo: '🏘️ Ventas por Municipio',
      descripcion: 'Análisis de ventas por ubicación'
    },
    {
      id: 'tendencias-ventas',
      titulo: '📈 Tendencias de Ventas',
      descripcion: 'Evolución de ventas en el tiempo'
    },
    {
      id: 'rentabilidad',
      titulo: '💰 Análisis de Rentabilidad',
      descripcion: 'Margen de ganancia por producto'
    },
    {
      id: 'clientes-inactivos',
      titulo: '😴 Clientes Inactivos',
      descripcion: 'Clientes que no compran hace tiempo'
    }
  ];

  const cargarDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const dashboard = await reportesService.getDashboard();
      setReporteData(dashboard);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarReporte = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      
      switch (reporteActivo) {
        case 'inventario-bajo':
          data = await reportesService.getStockBajo(filtros.stockMinimo);
          break;
        case 'productos-vencimiento':
          data = await reportesService.getProximosVencer();
          break;
        case 'faltantes':
          data = await reportesService.getFaltantes();
          break;
        case 'top-clientes':
          data = await reportesService.getTopClientes(filtros);
          break;
        case 'top-productos':
          data = await reportesService.getTopProductos(filtros);
          break;
        case 'ventas-municipio':
          data = await reportesService.getVentasPorMunicipio(filtros);
          break;
        case 'tendencias-ventas':
          data = await reportesService.getTendenciasVentas(filtros);
          break;
        case 'rentabilidad':
          data = await reportesService.getAnalisisRentabilidad(filtros);
          break;
        case 'clientes-inactivos':
          data = await reportesService.getClientesInactivos();
          break;
        default:
          data = {};
      }
      
      setReporteData(data);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      alert('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, [reporteActivo, filtros]);

  useEffect(() => {
    if (reporteActivo === 'dashboard') {
      cargarDashboard();
    } else {
      cargarReporte();
    }
  }, [reporteActivo, filtros, cargarDashboard, cargarReporte]);

  const exportarReporte = async () => {
    try {
      await reportesService.exportarReporte(reporteActivo, reporteData);
      alert('Reporte exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar el reporte');
    }
  };

  const renderFiltros = () => {
    if (reporteActivo === 'dashboard') return null;

    return (
      <div className="filtros-reporte">
        <h4>🔍 Filtros</h4>
        <div className="filtros-grid">
          {['top-clientes', 'top-productos', 'ventas-municipio', 'tendencias-ventas', 'rentabilidad'].includes(reporteActivo) && (
            <>
              <div className="filtro-item">
                <label>Fecha Inicio:</label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="filtro-item">
                <label>Fecha Fin:</label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                  className="form-input"
                />
              </div>
            </>
          )}
          
          {reporteActivo === 'inventario-bajo' && (
            <div className="filtro-item">
              <label>Stock Mínimo:</label>
              <input
                type="number"
                value={filtros.stockMinimo}
                onChange={(e) => setFiltros({...filtros, stockMinimo: parseInt(e.target.value)})}
                className="form-input"
                min="0"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContenidoReporte = () => {
    if (loading) {
      return (
        <div className="reporte-loading">
          <div className="loading-spinner">Generando reporte...</div>
        </div>
      );
    }

    switch (reporteActivo) {
      case 'dashboard':
        return <DashboardGeneral data={reporteData} />;
      case 'inventario-bajo':
        return <ReporteStockBajo data={reporteData} />;
      case 'productos-vencimiento':
        return <ReporteVencimiento data={reporteData} />;
      case 'faltantes':
        return <ReporteFaltantes data={reporteData} />;
      case 'top-clientes':
        return <ReporteTopClientes data={reporteData} />;
      case 'top-productos':
        return <ReporteTopProductos data={reporteData} />;
      case 'ventas-municipio':
        return <ReporteVentasMunicipio data={reporteData} />;
      case 'tendencias-ventas':
        return <ReporteTendencias data={reporteData} />;
      case 'rentabilidad':
        return <ReporteRentabilidad data={reporteData} />;
      case 'clientes-inactivos':
        return <ReporteClientesInactivos data={reporteData} />;
      default:
        return <div>Selecciona un reporte</div>;
    }
  };

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <h1>📊 Centro de Reportes</h1>
        <div className="reportes-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            🖨️ Imprimir
          </button>
          <button className="btn btn-primary" onClick={exportarReporte}>
            💾 Exportar
          </button>
        </div>
      </div>

      <div className="reportes-layout">
        {/* Sidebar con lista de reportes */}
        <div className="reportes-sidebar">
          <h3>📋 Reportes Disponibles</h3>
          <div className="reportes-lista">
            {reportes.map(reporte => (
              <div
                key={reporte.id}
                className={`reporte-item ${reporteActivo === reporte.id ? 'active' : ''}`}
                onClick={() => setReporteActivo(reporte.id)}
              >
                <h4>{reporte.titulo}</h4>
                <p>{reporte.descripcion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="reportes-contenido">
          {renderFiltros()}
          <div className="reporte-resultado">
            {renderContenidoReporte()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componentes para cada tipo de reporte
const DashboardGeneral = ({ data }) => (
  <div className="dashboard-general">
    <h2>📊 Dashboard General</h2>
    <div className="dashboard-stats">
      <div className="stat-card">
        <h3>Ventas Total</h3>
        <div className="stat-value">${data.ventasTotal?.toLocaleString() || 0}</div>
      </div>
      <div className="stat-card">
        <h3>Productos en Stock</h3>
        <div className="stat-value">{data.productosEnStock || 0}</div>
      </div>
      <div className="stat-card">
        <h3>Clientes Activos</h3>
        <div className="stat-value">{data.clientesActivos || 0}</div>
      </div>
      <div className="stat-card">
        <h3>Productos Bajo Stock</h3>
        <div className="stat-value critical">{data.productosBajoStock || 0}</div>
      </div>
    </div>
  </div>
);

const ReporteStockBajo = ({ data }) => (
  <div className="reporte-tabla">
    <h2>⚠️ Productos con Stock Bajo</h2>
    {data.productos && data.productos.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Stock Actual</th>
            <th>Stock Mínimo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.productos.map(producto => (
            <tr key={producto.codigo_producto}>
              <td>{producto.codigo_producto}</td>
              <td>{producto.nombre_producto}</td>
              <td className={producto.stock <= 5 ? 'critical' : 'warning'}>{producto.stock}</td>
              <td>{producto.stock_minimo || 10}</td>
              <td>
                <span className={`estado ${producto.stock === 0 ? 'agotado' : producto.stock <= 5 ? 'critico' : 'bajo'}`}>
                  {producto.stock === 0 ? 'Agotado' : producto.stock <= 5 ? 'Crítico' : 'Bajo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="no-data">No hay productos con stock bajo</div>
    )}
  </div>
);

const ReporteVencimiento = ({ data }) => (
  <div className="reporte-tabla">
    <h2>📅 Productos Próximos a Vencer</h2>
    {data.productos && data.productos.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Fecha Vencimiento</th>
            <th>Días Restantes</th>
            <th>Stock</th>
            <th>Urgencia</th>
          </tr>
        </thead>
        <tbody>
          {data.productos.map((producto, index) => (
            <tr key={index}>
              <td>{producto.nombre_producto}</td>
              <td>{new Date(producto.fecha_vencimiento).toLocaleDateString()}</td>
              <td>{producto.dias_restantes}</td>
              <td>{producto.stock}</td>
              <td>
                <span className={`urgencia ${producto.dias_restantes <= 7 ? 'alta' : producto.dias_restantes <= 30 ? 'media' : 'baja'}`}>
                  {producto.dias_restantes <= 7 ? 'Alta' : producto.dias_restantes <= 30 ? 'Media' : 'Baja'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="no-data">No hay productos próximos a vencer</div>
    )}
  </div>
);

const ReporteFaltantes = ({ data }) => (
  <div className="reporte-tabla">
    <h2>🚫 Productos Faltantes (Sin Stock)</h2>
    {data.productos && data.productos.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Última Venta</th>
            <th>Días sin Stock</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {data.productos.map(producto => (
            <tr key={producto.codigo_producto}>
              <td>{producto.codigo_producto}</td>
              <td>{producto.nombre_producto}</td>
              <td>{producto.ultima_venta ? new Date(producto.ultima_venta).toLocaleDateString() : 'N/A'}</td>
              <td>{producto.dias_sin_stock}</td>
              <td>
                <button className="btn btn-small btn-primary">Reabastecer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="no-data">¡Todos los productos tienen stock disponible!</div>
    )}
  </div>
);

const ReporteTopClientes = ({ data }) => (
  <div className="reporte-ranking">
    <h2>👥 Top Clientes</h2>
    {data.clientes && data.clientes.length > 0 ? (
      <div className="ranking-lista">
        {data.clientes.map((cliente, index) => (
          <div key={cliente.id} className="ranking-item">
            <div className="ranking-posicion">#{index + 1}</div>
            <div className="ranking-info">
              <h4>{cliente.nombre_cliente}</h4>
              <p>{cliente.numero_documento}</p>
              <p>{cliente.municipio}</p>
            </div>
            <div className="ranking-stats">
              <div className="stat">
                <span className="label">Total Compras:</span>
                <span className="value">${cliente.total_compras?.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="label">Nº Ventas:</span>
                <span className="value">{cliente.numero_ventas}</span>
              </div>
              <div className="stat">
                <span className="label">Promedio:</span>
                <span className="value">${cliente.promedio_compra?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="no-data">No hay datos de clientes</div>
    )}
  </div>
);

const ReporteTopProductos = ({ data }) => (
  <div className="reporte-ranking">
    <h2>📦 Productos Más Vendidos</h2>
    {data.productos && data.productos.length > 0 ? (
      <div className="ranking-lista">
        {data.productos.map((producto, index) => (
          <div key={producto.codigo_producto} className="ranking-item">
            <div className="ranking-posicion">#{index + 1}</div>
            <div className="ranking-info">
              <h4>{producto.nombre_producto}</h4>
              <p>Código: {producto.codigo_producto}</p>
            </div>
            <div className="ranking-stats">
              <div className="stat">
                <span className="label">Cantidad Vendida:</span>
                <span className="value">{producto.cantidad_vendida}</span>
              </div>
              <div className="stat">
                <span className="label">Ingresos:</span>
                <span className="value">${producto.ingresos_generados?.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="label">Stock Actual:</span>
                <span className="value">{producto.stock_actual}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="no-data">No hay datos de productos</div>
    )}
  </div>
);

const ReporteVentasMunicipio = ({ data }) => (
  <div className="reporte-ubicaciones">
    <h2>🏘️ Ventas por Municipio</h2>
    {data.municipios && data.municipios.length > 0 ? (
      <div className="municipios-grid">
        {data.municipios.map(municipio => (
          <div key={municipio.municipio} className="municipio-card">
            <h4>{municipio.municipio}</h4>
            <div className="municipio-stats">
              <div className="stat">
                <span className="label">Total Ventas:</span>
                <span className="value">${municipio.total_ventas?.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="label">Nº Transacciones:</span>
                <span className="value">{municipio.numero_transacciones}</span>
              </div>
              <div className="stat">
                <span className="label">Clientes:</span>
                <span className="value">{municipio.numero_clientes}</span>
              </div>
              <div className="stat">
                <span className="label">Promedio por Venta:</span>
                <span className="value">${municipio.promedio_venta?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="no-data">No hay datos de ventas por municipio</div>
    )}
  </div>
);

const ReporteTendencias = ({ data }) => (
  <div className="reporte-tendencias">
    <h2>📈 Tendencias de Ventas</h2>
    {data.tendencias && data.tendencias.length > 0 ? (
      <div className="tendencias-container">
        <div className="tendencias-grafico">
          {/* Aquí podrías integrar una librería de gráficos como Chart.js */}
          <div className="grafico-placeholder">
            <p>📊 Gráfico de Tendencias</p>
            <p>(Integración con Chart.js pendiente)</p>
          </div>
        </div>
        <div className="tendencias-tabla">
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Ventas</th>
                <th>Crecimiento</th>
              </tr>
            </thead>
            <tbody>
              {data.tendencias.map(periodo => (
                <tr key={periodo.periodo}>
                  <td>{periodo.periodo}</td>
                  <td>${periodo.total_ventas?.toLocaleString()}</td>
                  <td className={periodo.crecimiento >= 0 ? 'positivo' : 'negativo'}>
                    {periodo.crecimiento >= 0 ? '↗️' : '↘️'} {periodo.crecimiento}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      <div className="no-data">No hay datos de tendencias</div>
    )}
  </div>
);

const ReporteRentabilidad = ({ data }) => (
  <div className="reporte-rentabilidad">
    <h2>💰 Análisis de Rentabilidad</h2>
    {data.productos && data.productos.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Costo</th>
            <th>Precio Venta</th>
            <th>Margen $</th>
            <th>Margen %</th>
            <th>Rentabilidad</th>
          </tr>
        </thead>
        <tbody>
          {data.productos.map(producto => (
            <tr key={producto.codigo_producto}>
              <td>{producto.nombre_producto}</td>
              <td>${producto.costo?.toLocaleString()}</td>
              <td>${producto.precio_venta?.toLocaleString()}</td>
              <td>${producto.margen_pesos?.toLocaleString()}</td>
              <td>{producto.margen_porcentaje}%</td>
              <td>
                <span className={`rentabilidad ${producto.margen_porcentaje >= 50 ? 'alta' : producto.margen_porcentaje >= 20 ? 'media' : 'baja'}`}>
                  {producto.margen_porcentaje >= 50 ? 'Alta' : producto.margen_porcentaje >= 20 ? 'Media' : 'Baja'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="no-data">No hay datos de rentabilidad</div>
    )}
  </div>
);

const ReporteClientesInactivos = ({ data }) => (
  <div className="reporte-tabla">
    <h2>😴 Clientes Inactivos</h2>
    {data.clientes && data.clientes.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Última Compra</th>
            <th>Días Inactivo</th>
            <th>Total Histórico</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {data.clientes.map(cliente => (
            <tr key={cliente.id}>
              <td>{cliente.nombre_cliente}</td>
              <td>{cliente.ultima_compra ? new Date(cliente.ultima_compra).toLocaleDateString() : 'Nunca'}</td>
              <td>{cliente.dias_inactivo}</td>
              <td>${cliente.total_historico?.toLocaleString()}</td>
              <td>
                <button className="btn btn-small btn-secondary">Contactar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="no-data">Todos los clientes están activos</div>
    )}
  </div>
);

export default ReportesPage;
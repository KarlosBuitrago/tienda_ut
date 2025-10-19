const API_BASE_URL = 'http://localhost:3006/api';

export const reportesService = {
  // Dashboard General
  async getDashboard() {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/dashboard`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      throw error;
    }
  },

  // Productos con Stock Bajo
  async getStockBajo(stockMinimo = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/stock-bajo?minimo=${stockMinimo}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar reporte de stock bajo:', error);
      throw error;
    }
  },

  // Productos Próximos a Vencer
  async getProximosVencer(diasLimite = 30) {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/proximos-vencer?dias=${diasLimite}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar reporte de vencimientos:', error);
      throw error;
    }
  },

  // Productos Faltantes (Sin Stock)
  async getFaltantes() {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/faltantes`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar reporte de faltantes:', error);
      throw error;
    }
  },

  // Top Clientes
  async getTopClientes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      if (filtros.limite) params.append('limite', filtros.limite.toString());
      
      const response = await fetch(`${API_BASE_URL}/reportes/top-clientes?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar top clientes:', error);
      throw error;
    }
  },

  // Top Productos Más Vendidos
  async getTopProductos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      if (filtros.limite) params.append('limite', filtros.limite.toString());
      
      const response = await fetch(`${API_BASE_URL}/reportes/top-productos?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar top productos:', error);
      throw error;
    }
  },

  // Ventas por Municipio
  async getVentasPorMunicipio(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      
      const response = await fetch(`${API_BASE_URL}/reportes/ventas-municipio?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar ventas por municipio:', error);
      throw error;
    }
  },

  // Tendencias de Ventas
  async getTendenciasVentas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      params.append('periodo', filtros.periodo || 'mensual'); // mensual, semanal, diario
      
      const response = await fetch(`${API_BASE_URL}/reportes/tendencias-ventas?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar tendencias de ventas:', error);
      throw error;
    }
  },

  // Análisis de Rentabilidad
  async getAnalisisRentabilidad(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      
      const response = await fetch(`${API_BASE_URL}/reportes/rentabilidad?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar análisis de rentabilidad:', error);
      throw error;
    }
  },

  // Clientes Inactivos
  async getClientesInactivos(diasInactividad = 30) {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/clientes-inactivos?dias=${diasInactividad}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al cargar clientes inactivos:', error);
      throw error;
    }
  },

  // Exportar Reporte (CSV/PDF)
  async exportarReporte(tipoReporte, datos, formato = 'csv') {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/exportar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipoReporte,
          datos,
          formato
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      throw error;
    }
  },

  // Reporte Personalizado
  async getReportePersonalizado(query, parametros = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/personalizado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          parametros
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al ejecutar reporte personalizado:', error);
      throw error;
    }
  }
};
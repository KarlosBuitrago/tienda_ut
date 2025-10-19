const API_BASE_URL = 'http://localhost:3006/api';

// ===== SERVICIOS PARA VENTAS =====

export const ventasService = {
  // Obtener todas las ventas
  getAll: async () => {
    try {
      console.log('🌐 Haciendo petición a:', `${API_BASE_URL}/ventas`);
      const response = await fetch(`${API_BASE_URL}/ventas`);
      console.log('📡 Respuesta recibida:', response.status, response.statusText);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en getAll ventas:', error);
      throw error;
    }
  },

  // Obtener una venta específica con detalles
  getById: async (numero_venta) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ventas/${numero_venta}`);
      if (!response.ok) throw new Error('Error al obtener venta');
      return await response.json();
    } catch (error) {
      console.error('Error en getById venta:', error);
      throw error;
    }
  },

  // Crear nueva venta
  create: async (ventaData) => {
    try {
      console.log('📤 Enviando nueva venta:', ventaData);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
      
      const response = await fetch(`${API_BASE_URL}/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ventaData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear venta');
      }
      
      console.log('✅ Venta creada exitosamente:', result);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ Timeout: La petición tardó más de 30 segundos');
        throw new Error('La petición está tardando mucho. Por favor, inténtalo de nuevo.');
      }
      console.error('❌ Error en create venta:', error);
      throw error;
    }
  },

  // Cancelar venta
  delete: async (numero_venta) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ventas/${numero_venta}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al cancelar venta');
      }
      
      return result;
    } catch (error) {
      console.error('Error en delete venta:', error);
      throw error;
    }
  },

  // Obtener estadísticas
  getStats: async () => {
    try {
      console.log('📊 Haciendo petición a:', `${API_BASE_URL}/ventas/stats/resumen`);
      const response = await fetch(`${API_BASE_URL}/ventas/stats/resumen`);
      console.log('📡 Respuesta de stats:', response.status, response.statusText);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log('📊 Stats recibidas:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en getStats:', error);
      throw error;
    }
  },
};

// ===== SERVICIOS AUXILIARES =====

export const productosVentaService = {
  // Obtener productos disponibles para venta
  getAvailable: async () => {
    try {
      console.log('🔍 Haciendo petición a:', `${API_BASE_URL}/productos-venta`);
      const response = await fetch(`${API_BASE_URL}/productos-venta`);
      console.log('📡 Respuesta productos:', response.status, response.statusText);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log('📦 Productos recibidos:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error en getAvailable productos:', error);
      throw error;
    }
  },
};

export const mediosPagoService = {
  // Obtener medios de pago
  getAll: async () => {
    try {
      console.log('🔍 Haciendo petición a:', `${API_BASE_URL}/medios-pago`);
      const response = await fetch(`${API_BASE_URL}/medios-pago`);
      console.log('📡 Respuesta medios pago:', response.status, response.statusText);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log('💳 Medios de pago recibidos:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error en getAll medios pago:', error);
      throw error;
    }
  },
};

export const entidadesFinancierasService = {
  // Obtener entidades financieras
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/entidades-financieras`);
      if (!response.ok) throw new Error('Error al obtener entidades financieras');
      return await response.json();
    } catch (error) {
      console.error('Error en getAll entidades financieras:', error);
      throw error;
    }
  },
};

// ===== SERVICIOS REUTILIZABLES =====

export const clientesService = {
  // Obtener todos los clientes (reutilizado)
  getAll: async () => {
    try {
      console.log('🔍 Haciendo petición a:', `${API_BASE_URL}/clientes`);
      const response = await fetch(`${API_BASE_URL}/clientes`);
      console.log('📡 Respuesta clientes:', response.status, response.statusText);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log('👥 Clientes recibidos:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error en getAll clientes:', error);
      throw error;
    }
  },

  // Buscar cliente por documento
  searchByDocument: async (documento) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes`);
      if (!response.ok) throw new Error('Error al buscar cliente');
      const clientes = await response.json();
      return clientes.filter(cliente => 
        cliente.numero_documento.toLowerCase().includes(documento.toLowerCase())
      );
    } catch (error) {
      console.error('Error en searchByDocument:', error);
      throw error;
    }
  },
};
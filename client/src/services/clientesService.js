// ===== SERVICIO API PARA CLIENTES =====

const API_BASE_URL = 'http://localhost:3006/api';

class ClientesService {
  // ===== MÉTODOS PARA CLIENTES =====
  
  async getAllClientes() {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }

  async getClienteById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${id}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      throw error;
    }
  }

  async createCliente(clienteData) {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear cliente');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }

  async updateCliente(id, clienteData) {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar cliente');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  async deleteCliente(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar cliente');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  }

  // ===== MÉTODOS PARA DATOS AUXILIARES =====

  async getTiposDocumento() {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-documento`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener tipos de documento:', error);
      throw error;
    }
  }

  async getMunicipios() {
    try {
      const response = await fetch(`${API_BASE_URL}/municipios`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener municipios:', error);
      throw error;
    }
  }

  // ===== MÉTODOS PARA TELÉFONOS =====

  async addTelefono(clienteId, telefonoData) {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${clienteId}/telefonos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telefonoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar teléfono');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al agregar teléfono:', error);
      throw error;
    }
  }

  async deleteTelefono(telefonoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/telefonos/${telefonoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar teléfono');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al eliminar teléfono:', error);
      throw error;
    }
  }
}

// Exportar una instancia única del servicio
const clientesService = new ClientesService();
export default clientesService;
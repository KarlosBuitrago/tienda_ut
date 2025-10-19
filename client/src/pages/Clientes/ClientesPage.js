import React, { useState, useEffect } from 'react';
import ClienteForm from './ClienteForm';
import './ClientesPage.css';

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadClientes();
    loadTiposDocumento();
    loadMunicipios();
  }, []);

  const loadClientes = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/clientes');
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const loadTiposDocumento = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/tipos-documento');
      const data = await response.json();
      setTiposDocumento(data);
    } catch (error) {
      console.error('Error al cargar tipos de documento:', error);
    }
  };

  const loadMunicipios = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/municipios');
      const data = await response.json();
      setMunicipios(data);
    } catch (error) {
      console.error('Error al cargar municipios:', error);
    }
  };

  const handleSaveCliente = () => {
    loadClientes(); // Recargar la lista
    setShowForm(false);
    setEditingCliente(null);
  };

  const handleEditCliente = (cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
  };

  const handleDeleteCliente = async (clienteId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        const response = await fetch(`http://localhost:3006/api/clientes/${clienteId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          alert('Cliente eliminado exitosamente');
          loadClientes();
        } else {
          const errorData = await response.json();
          alert(`Error al eliminar cliente: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('Error de conexión al eliminar cliente');
      }
    }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  return (
    <div className="clientes-page">
      <div className="page-header">
        <h1>👥 Gestión de Clientes</h1>
        <p className="page-subtitle">Administra la base de datos de tus clientes</p>
      </div>

      <div className="main-container">
        {showForm ? (
          <div className="form-container">
            <div className="form-header">
              <h2>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingCliente(null);
                }}
              >
                ❌ Cancelar
              </button>
            </div>
            <ClienteForm
              cliente={editingCliente}
              tiposDocumento={tiposDocumento}
              municipios={municipios}
              onSave={handleSaveCliente}
            />
          </div>
        ) : (
          <>
            <div className="actions-bar">
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                ➕ Nuevo Cliente
              </button>
            </div>

            <div className="clientes-table-container">
              <div className="table-header">
                <h2>👥 Lista de Clientes ({clientes.length})</h2>
              </div>
              
              {clientes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <div className="empty-state-text">No hay clientes registrados</div>
                  <div className="empty-state-subtext">Agrega tu primer cliente para comenzar</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="clientes-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>Tipo Doc.</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Municipio</th>
                        <th>Edad</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td><strong>#{cliente.id}</strong></td>
                          <td>
                            <div className="cliente-info">
                              <strong>{cliente.nombre_cliente}</strong>
                              <small>{cliente.genero_cliente}</small>
                            </div>
                          </td>
                          <td>{cliente.numero_documento}</td>
                          <td>{cliente.nombre_tipo_documento}</td>
                          <td>
                            {cliente.telefonos && cliente.telefonos.length > 0 ? (
                              <div className="telefono-info">
                                {cliente.telefonos[0].numero_telefono}
                                {cliente.telefonos.length > 1 && (
                                  <small>+{cliente.telefonos.length - 1} más</small>
                                )}
                              </div>
                            ) : (
                              <span className="no-data">Sin teléfono</span>
                            )}
                          </td>
                          <td>
                            {cliente.email ? (
                              <a href={`mailto:${cliente.email}`} className="email-link">
                                {cliente.email}
                              </a>
                            ) : (
                              <span className="no-data">Sin email</span>
                            )}
                          </td>
                          <td>{cliente.nombre_municipio}</td>
                          <td>
                            <span className="edad">
                              {calcularEdad(cliente.fecha_nacimiento)} años
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button 
                                onClick={() => handleEditCliente(cliente)}
                                className="btn btn-table btn-edit"
                                title="Editar cliente"
                              >
                                ✏️ Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteCliente(cliente.id)}
                                className="btn btn-table btn-delete"
                                title="Eliminar cliente"
                              >
                                🗑️ Eliminar
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
      </div>
    </div>
  );
};

export default ClientesPage;
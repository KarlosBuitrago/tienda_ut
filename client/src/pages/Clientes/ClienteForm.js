import React, { useState, useEffect } from 'react';
import clientesService from '../../services/clientesService';

const ClienteForm = ({ cliente, isEditing, onSave, onCancel }) => {
  // ===== ESTADOS DEL FORMULARIO =====
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    direccion_cliente: '',
    genero_cliente: '',
    numero_documento: '',
    id_tipo_documento: '',
    id_municipio: '',
    fecha_nacimiento: '',
    email: '',
    telefonos: []
  });

  // Estados para datos auxiliares
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Estado para nuevo teléfono
  const [nuevoTelefono, setNuevoTelefono] = useState({
    numero_telefono: '',
    tipo_telefono: 'movil',
    ubicacion_telefono: ''
  });

  // ===== EFECTOS =====
  useEffect(() => {
    cargarDatosAuxiliares();
  }, []);

  useEffect(() => {
    if (cliente && isEditing) {
      setFormData({
        nombre_cliente: cliente.nombre_cliente || '',
        direccion_cliente: cliente.direccion_cliente || '',
        genero_cliente: cliente.genero_cliente || '',
        numero_documento: cliente.numero_documento || '',
        id_tipo_documento: cliente.id_tipo_documento || '',
        id_municipio: cliente.id_municipio || '',
        fecha_nacimiento: cliente.fecha_nacimiento ? cliente.fecha_nacimiento.split('T')[0] : '',
        email: cliente.email || '',
        telefonos: cliente.telefonos || []
      });
    }
  }, [cliente, isEditing]);

  // ===== FUNCIONES =====
  const cargarDatosAuxiliares = async () => {
    try {
      const [tiposDoc, munic] = await Promise.all([
        clientesService.getTiposDocumento(),
        clientesService.getMunicipios()
      ]);
      setTiposDocumento(tiposDoc);
      setMunicipios(munic);
    } catch (error) {
      console.error('Error al cargar datos auxiliares:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTelefonoChange = (e) => {
    const { name, value } = e.target;
    setNuevoTelefono(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const agregarTelefono = () => {
    if (nuevoTelefono.numero_telefono.trim()) {
      setFormData(prev => ({
        ...prev,
        telefonos: [...prev.telefonos, { ...nuevoTelefono, id: Date.now() }]
      }));
      setNuevoTelefono({
        numero_telefono: '',
        tipo_telefono: 'movil',
        ubicacion_telefono: ''
      });
    }
  };

  const eliminarTelefono = (index) => {
    setFormData(prev => ({
      ...prev,
      telefonos: prev.telefonos.filter((_, i) => i !== index)
    }));
  };

  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.nombre_cliente.trim()) {
      newErrors.nombre_cliente = 'El nombre es requerido';
    }

    if (!formData.numero_documento.trim()) {
      newErrors.numero_documento = 'El número de documento es requerido';
    }

    if (!formData.id_tipo_documento) {
      newErrors.id_tipo_documento = 'El tipo de documento es requerido';
    }

    if (!formData.id_municipio) {
      newErrors.id_municipio = 'El municipio es requerido';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      // Limpiar formulario si es creación
      if (!isEditing) {
        setFormData({
          nombre_cliente: '',
          direccion_cliente: '',
          genero_cliente: '',
          numero_documento: '',
          id_tipo_documento: '',
          id_municipio: '',
          fecha_nacimiento: '',
          email: '',
          telefonos: []
        });
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="product-form-container">
      <h2 className="form-title">
        {isEditing ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Nombre */}
          <div className="form-group">
            <label className="form-label">Nombre Completo *</label>
            <input
              type="text"
              name="nombre_cliente"
              className={`form-input ${errors.nombre_cliente ? 'error' : ''}`}
              placeholder="Ej: Juan Pérez García"
              value={formData.nombre_cliente}
              onChange={handleChange}
              required
            />
            {errors.nombre_cliente && <span className="error-text">{errors.nombre_cliente}</span>}
          </div>

          {/* Tipo de Documento */}
          <div className="form-group">
            <label className="form-label">Tipo de Documento *</label>
            <select
              name="id_tipo_documento"
              className={`form-input ${errors.id_tipo_documento ? 'error' : ''}`}
              value={formData.id_tipo_documento}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar tipo</option>
              {tiposDocumento.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre_tipo_documento}
                </option>
              ))}
            </select>
            {errors.id_tipo_documento && <span className="error-text">{errors.id_tipo_documento}</span>}
          </div>

          {/* Número de Documento */}
          <div className="form-group">
            <label className="form-label">Número de Documento *</label>
            <input
              type="text"
              name="numero_documento"
              className={`form-input ${errors.numero_documento ? 'error' : ''}`}
              placeholder="Ej: 12345678"
              value={formData.numero_documento}
              onChange={handleChange}
              required
            />
            {errors.numero_documento && <span className="error-text">{errors.numero_documento}</span>}
          </div>

          {/* Género */}
          <div className="form-group">
            <label className="form-label">Género</label>
            <select
              name="genero_cliente"
              className="form-input"
              value={formData.genero_cliente}
              onChange={handleChange}
            >
              <option value="">Seleccionar género</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </div>

          {/* Municipio */}
          <div className="form-group">
            <label className="form-label">Municipio *</label>
            <select
              name="id_municipio"
              className={`form-input ${errors.id_municipio ? 'error' : ''}`}
              value={formData.id_municipio}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar municipio</option>
              {municipios.map(municipio => (
                <option key={municipio.id} value={municipio.id}>
                  {municipio.nombre_municipio}
                </option>
              ))}
            </select>
            {errors.id_municipio && <span className="error-text">{errors.id_municipio}</span>}
          </div>

          {/* Dirección */}
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              name="direccion_cliente"
              className="form-input"
              placeholder="Ej: Calle 123 #45-67"
              value={formData.direccion_cliente}
              onChange={handleChange}
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div className="form-group">
            <label className="form-label">Fecha de Nacimiento</label>
            <input
              type="date"
              name="fecha_nacimiento"
              className="form-input"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Ej: juan@email.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
        </div>

        {/* Sección de Teléfonos */}
        <div className="telefonos-section">
          <h3 className="section-title">📞 Teléfonos</h3>
          
          {/* Lista de teléfonos existentes */}
          {formData.telefonos.length > 0 && (
            <div className="telefonos-list">
              {formData.telefonos.map((telefono, index) => (
                <div key={index} className="telefono-item">
                  <span className="telefono-info">
                    <strong>{telefono.numero_telefono}</strong> 
                    <span className="telefono-tipo">({telefono.tipo_telefono})</span>
                    {telefono.ubicacion_telefono && (
                      <span className="telefono-ubicacion"> - {telefono.ubicacion_telefono}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn btn-table btn-delete"
                    onClick={() => eliminarTelefono(index)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulario para agregar teléfono */}
          <div className="telefono-form">
            <div className="form-grid-telefono">
              <input
                type="tel"
                name="numero_telefono"
                className="form-input"
                placeholder="Número de teléfono"
                value={nuevoTelefono.numero_telefono}
                onChange={handleTelefonoChange}
              />
              <select
                name="tipo_telefono"
                className="form-input"
                value={nuevoTelefono.tipo_telefono}
                onChange={handleTelefonoChange}
              >
                <option value="movil">Móvil</option>
                <option value="fijo">Fijo</option>
                <option value="trabajo">Trabajo</option>
              </select>
              <input
                type="text"
                name="ubicacion_telefono"
                className="form-input"
                placeholder="Ubicación (opcional)"
                value={nuevoTelefono.ubicacion_telefono}
                onChange={handleTelefonoChange}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={agregarTelefono}
                disabled={!nuevoTelefono.numero_telefono.trim()}
              >
                ➕ Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-form btn-primary"
            disabled={loading}
          >
            {loading ? '⏳ Guardando...' : (isEditing ? '💾 Actualizar' : '➕ Crear Cliente')}
          </button>
          
          {isEditing && (
            <button 
              type="button" 
              className="btn btn-form btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              ❌ Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ClienteForm;
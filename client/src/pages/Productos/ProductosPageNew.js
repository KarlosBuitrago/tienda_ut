import React, { useState, useEffect } from 'react';
import './ProductosPageNew.css';

const ProductosPageNew = () => {
  const [productos, setProductos] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStock, setFilterStock] = useState('todos');
  const [sortBy, setSortBy] = useState('nombre');
  const [viewMode, setViewMode] = useState('cards');
  
  const [formData, setFormData] = useState({
    id_tipo_producto: '',
    id_unidad_medida: '',
    nombre_producto: '',
    precio_venta: '',
    costo: '',
    stock: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [productosRes, tiposRes, unidadesRes] = await Promise.all([
        fetch('http://localhost:3006/api/productos'),
        fetch('http://localhost:3006/api/tipos-producto'),
        fetch('http://localhost:3006/api/unidades-medida')
      ]);

      const productosData = await productosRes.json();
      const tiposData = await tiposRes.json();
      const unidadesData = await unidadesRes.json();

      setProductos(productosData);
      setTiposProducto(tiposData);
      setUnidadesMedida(unidadesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar productos
  const getProductosFiltrados = () => {
    let productosFiltrados = productos.filter(producto => {
      const matchSearch = producto.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipo = filterTipo === '' || producto.id_tipo_producto.toString() === filterTipo;
      const matchStock = filterStock === 'todos' || 
        (filterStock === 'bajo' && producto.stock <= 10) ||
        (filterStock === 'medio' && producto.stock > 10 && producto.stock <= 50) ||
        (filterStock === 'alto' && producto.stock > 50) ||
        (filterStock === 'agotado' && producto.stock === 0);
      
      return matchSearch && matchTipo && matchStock;
    });

    // Ordenar
    productosFiltrados.sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          return a.nombre_producto.localeCompare(b.nombre_producto);
        case 'precio':
          return b.precio_venta - a.precio_venta;
        case 'stock':
          return b.stock - a.stock;
        case 'rentabilidad':
          const rentabilidadA = ((a.precio_venta - a.costo) / a.precio_venta) * 100;
          const rentabilidadB = ((b.precio_venta - b.costo) / b.precio_venta) * 100;
          return rentabilidadB - rentabilidadA;
        default:
          return 0;
      }
    });

    return productosFiltrados;
  };

  // Manejar formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingProduct 
        ? `http://localhost:3006/api/productos/${editingProduct.codigo_producto}`
        : 'http://localhost:3006/api/productos';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await cargarDatos();
        resetForm();
        alert(editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
      } else {
        throw new Error('Error al guardar el producto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setFormData({
      id_tipo_producto: producto.id_tipo_producto.toString(),
      id_unidad_medida: producto.id_unidad_medida.toString(),
      nombre_producto: producto.nombre_producto,
      precio_venta: producto.precio_venta.toString(),
      costo: producto.costo.toString(),
      stock: producto.stock.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (codigo_producto) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        const response = await fetch(`http://localhost:3006/api/productos/${codigo_producto}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await cargarDatos();
          alert('Producto eliminado exitosamente');
        } else {
          throw new Error('Error al eliminar el producto');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id_tipo_producto: '',
      id_unidad_medida: '',
      nombre_producto: '',
      precio_venta: '',
      costo: '',
      stock: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'agotado', text: 'Agotado', color: '#e74c3c' };
    if (stock <= 10) return { status: 'bajo', text: 'Stock Bajo', color: '#f39c12' };
    if (stock <= 50) return { status: 'medio', text: 'Stock Medio', color: '#f1c40f' };
    return { status: 'alto', text: 'Stock Alto', color: '#27ae60' };
  };

  const calcularRentabilidad = (precio, costo) => {
    if (costo === 0) return 0;
    return ((precio - costo) / precio * 100).toFixed(1);
  };

  const getTipoProductoNombre = (id) => {
    const tipo = tiposProducto.find(t => t.id === id);
    return tipo ? tipo.nombre_tipo_producto : 'Sin tipo';
  };

  const getUnidadMedidaNombre = (id) => {
    const unidad = unidadesMedida.find(u => u.id === id);
    return unidad ? unidad.nombre_unidad_medida : 'Sin unidad';
  };

  const renderProductCard = (producto) => {
    const stockStatus = getStockStatus(producto.stock);
    const rentabilidad = calcularRentabilidad(producto.precio_venta, producto.costo);
    
    return (
      <div key={producto.codigo_producto} className="product-card">
        <div className="product-card-header">
          <div className="product-id">#{producto.codigo_producto}</div>
          <div className={`stock-badge ${stockStatus.status}`} style={{ backgroundColor: stockStatus.color }}>
            {stockStatus.text}
          </div>
        </div>
        
        <div className="product-card-body">
          <h3 className="product-name">{producto.nombre_producto}</h3>
          <div className="product-meta">
            <span className="product-type">
              🏷️ {getTipoProductoNombre(producto.id_tipo_producto)}
            </span>
            <span className="product-unit">
              📦 {getUnidadMedidaNombre(producto.id_unidad_medida)}
            </span>
          </div>
          
          <div className="product-stats">
            <div className="stat-item">
              <span className="stat-label">Precio</span>
              <span className="stat-value precio">${producto.precio_venta.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Costo</span>
              <span className="stat-value costo">${producto.costo.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Stock</span>
              <span className="stat-value stock">{producto.stock}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rentabilidad</span>
              <span className={`stat-value rentabilidad ${rentabilidad >= 30 ? 'high' : rentabilidad >= 15 ? 'medium' : 'low'}`}>
                {rentabilidad}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="product-card-actions">
          <button className="btn-action btn-edit" onClick={() => handleEdit(producto)}>
            ✏️ Editar
          </button>
          <button className="btn-action btn-delete" onClick={() => handleDelete(producto.codigo_producto)}>
            🗑️ Eliminar
          </button>
        </div>
      </div>
    );
  };

  const renderProductList = (producto) => {
    const rentabilidad = calcularRentabilidad(producto.precio_venta, producto.costo);
    
    return (
      <div key={producto.codigo_producto} className="product-list-item">
        <div className="product-list-info">
          <div className="product-list-main">
            <span className="product-list-id">#{producto.codigo_producto}</span>
            <h4 className="product-list-name">{producto.nombre_producto}</h4>
            <span className="product-list-type">{getTipoProductoNombre(producto.id_tipo_producto)}</span>
          </div>
          <div className="product-list-stats">
            <span className="list-stat">💰 ${producto.precio_venta.toLocaleString()}</span>
            <span className="list-stat">📦 {producto.stock}</span>
            <span className="list-stat">📊 {rentabilidad}%</span>
          </div>
        </div>
        <div className="product-list-actions">
          <button className="btn-mini btn-edit" onClick={() => handleEdit(producto)}>✏️</button>
          <button className="btn-mini btn-delete" onClick={() => handleDelete(producto.codigo_producto)}>🗑️</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="productos-loading">
        <div className="loading-spinner">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="productos-page-new">
      {/* Header con controles */}
      <div className="productos-header">
        <div className="header-title">
          <h1>📦 Gestión de Productos</h1>
          <p>Administra tu inventario de manera inteligente</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary btn-add" onClick={() => setShowForm(true)}>
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      {/* Controles de filtrado y búsqueda */}
      <div className="productos-controls">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filters-section">
          <select 
            value={filterTipo} 
            onChange={(e) => setFilterTipo(e.target.value)}
            className="filter-select"
          >
            <option value="">🏷️ Todos los tipos</option>
            {tiposProducto.map(tipo => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre_tipo_producto}
              </option>
            ))}
          </select>

          <select 
            value={filterStock} 
            onChange={(e) => setFilterStock(e.target.value)}
            className="filter-select"
          >
            <option value="todos">📊 Todo el stock</option>
            <option value="agotado">🔴 Agotado</option>
            <option value="bajo">🟡 Stock Bajo (≤10)</option>
            <option value="medio">🟠 Stock Medio (11-50)</option>
            <option value="alto">🟢 Stock Alto (&gt;50)</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="nombre">📝 Ordenar por Nombre</option>
            <option value="precio">💰 Ordenar por Precio</option>
            <option value="stock">📦 Ordenar por Stock</option>
            <option value="rentabilidad">📈 Ordenar por Rentabilidad</option>
          </select>
        </div>

        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            🎴 Cards
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 Lista
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="productos-stats">
        <div className="stat-box">
          <div className="stat-number">{productos.length}</div>
          <div className="stat-label">Total Productos</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{productos.filter(p => p.stock <= 10).length}</div>
          <div className="stat-label">Stock Bajo</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{productos.filter(p => p.stock === 0).length}</div>
          <div className="stat-label">Agotados</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">
            ${productos.reduce((sum, p) => sum + (p.precio_venta * p.stock), 0).toLocaleString()}
          </div>
          <div className="stat-label">Valor Inventario</div>
        </div>
      </div>

      {/* Lista/Grid de productos */}
      <div className={`productos-container ${viewMode}`}>
        {viewMode === 'cards' ? (
          <div className="products-grid">
            {getProductosFiltrados().map(renderProductCard)}
          </div>
        ) : (
          <div className="products-list">
            {getProductosFiltrados().map(renderProductList)}
          </div>
        )}
        
        {getProductosFiltrados().length === 0 && (
          <div className="no-products">
            <div className="no-products-icon">📦</div>
            <h3>No se encontraron productos</h3>
            <p>Ajusta los filtros o agrega nuevos productos</p>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h2>
              <button className="modal-close" onClick={resetForm}>✖️</button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>📝 Nombre del Producto</label>
                  <input
                    type="text"
                    name="nombre_producto"
                    value={formData.nombre_producto}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="Ej: Arroz Diana x 500g"
                  />
                </div>

                <div className="form-group">
                  <label>🏷️ Tipo de Producto</label>
                  <select
                    name="id_tipo_producto"
                    value={formData.id_tipo_producto}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {tiposProducto.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre_tipo_producto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>📦 Unidad de Medida</label>
                  <select
                    name="id_unidad_medida"
                    value={formData.id_unidad_medida}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">Seleccionar unidad...</option>
                    {unidadesMedida.map(unidad => (
                      <option key={unidad.id} value={unidad.id}>
                        {unidad.nombre_unidad_medida}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>💰 Precio de Venta</label>
                  <input
                    type="number"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>🏷️ Costo</label>
                  <input
                    type="number"
                    name="costo"
                    value={formData.costo}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>📊 Stock Inicial</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Previsualización de rentabilidad */}
              {formData.precio_venta && formData.costo && (
                <div className="rentabilidad-preview">
                  <span className="preview-label">📈 Rentabilidad estimada:</span>
                  <span className={`preview-value ${calcularRentabilidad(parseFloat(formData.precio_venta), parseFloat(formData.costo)) >= 30 ? 'high' : 'medium'}`}>
                    {calcularRentabilidad(parseFloat(formData.precio_venta), parseFloat(formData.costo))}%
                  </span>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosPageNew;
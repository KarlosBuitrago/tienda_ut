import React , { useState, useEffect } from "react";
import "./ProductosPage.css";

const ProductosPage = () => {
  const [id_tipo_producto, setIdTipoProducto] = useState("");
  const [id_unidad_medida, setIdUnidadMedida] = useState("");
  const [nombre_producto, setNombreProducto] = useState("");
  const [precio_venta, setPrecioVenta] = useState(0);
  const [costo, setCosto] = useState(0);
  const [stock, setStock] = useState(0);

  const [productos, setProductos] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch("http://localhost:3006/api/productos");
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };
    cargarProductos();
  }, []);

  const registrarProductos = async (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      try {
        const producto = productos[editIndex];
        const response = await fetch(`http://localhost:3006/api/productos/${producto.codigo_producto}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_tipo_producto,
            id_unidad_medida,
            nombre_producto,
            precio_venta,
            costo,
            stock,
          }),
        });

        if (response.ok) {
          const nuevosProductos = [...productos];
          nuevosProductos[editIndex] = { 
            ...producto, 
            id_tipo_producto, 
            id_unidad_medida, 
            nombre_producto, 
            precio_venta, 
            costo, 
            stock 
          };
          setProductos(nuevosProductos);
          alert("Producto actualizado exitosamente");
        } else {
          const errorData = await response.json();
          alert(`Error al actualizar el producto: ${errorData.error || 'Error desconocido'}`);
        }
      } catch (error) {
        console.error("Error al actualizar el producto:", error);
        alert("Error de conexión al actualizar el producto");
      }
    } else {
      try {
        const response = await fetch("http://localhost:3006/api/productos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_tipo_producto,
            id_unidad_medida,
            nombre_producto,
            precio_venta,
            costo,
            stock,
          }),
        });

        const dato = await response.json();

        if (response.ok) {
          setProductos([...productos, dato]);
          alert("Producto registrado exitosamente");
        } else {
          alert("Error al registrar el producto");
        }
      } catch (error) {
        console.error("Error de conexion", error);
      }
    }

    // Reset form fields after any operation
    setEditIndex(null);
    setIdTipoProducto("");
    setIdUnidadMedida("");
    setNombreProducto("");
    setPrecioVenta(0);
    setCosto(0);
    setStock(0);
  };

  const eliminarProducto = async (index) => {
    const producto = productos[index];
    try {
      const response = await fetch(`http://localhost:3006/api/productos/${producto.codigo_producto}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProductos(productos.filter((_, i) => i !== index));
        if (editIndex === index) {
          setEditIndex(null);
          setIdTipoProducto("");
          setIdUnidadMedida("");
          setNombreProducto("");
          setPrecioVenta(0);
          setCosto(0);
          setStock(0);
        }
        alert("Producto eliminado exitosamente");
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar el producto: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error("error de conexion al eliminar", error);
      alert("Error de conexión al eliminar el producto");
    }
  };

  const editarProducto = (index) => {
    const producto = productos[index];
    setEditIndex(index);
    setIdTipoProducto(producto.id_tipo_producto);
    setIdUnidadMedida(producto.id_unidad_medida);
    setNombreProducto(producto.nombre_producto);
    setPrecioVenta(producto.precio_venta);
    setCosto(producto.costo);
    setStock(producto.stock);
  };

  return (
    <div className="productos-page">
      <div className="page-header">
        <h1>📦 Gestión de Productos</h1>
        <p className="page-subtitle">Administra el inventario de tu tienda</p>
      </div>

      <div className="main-container">
        <div className="product-form-container">
          <h2 className="form-title">
            {editIndex !== null ? "Actualizar Producto" : "Registrar Nuevo Producto"}
          </h2>
          
          <form onSubmit={registrarProductos}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">ID Tipo Producto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 1, 2, 3..."
                  value={id_tipo_producto}
                  onChange={(e) => setIdTipoProducto(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ID Unidad Medida</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 1, 2, 3..."
                  value={id_unidad_medida}
                  onChange={(e) => setIdUnidadMedida(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Arroz, Aceite, Azúcar..."
                  value={nombre_producto}
                  onChange={(e) => setNombreProducto(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Precio de Venta ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={precio_venta}
                  onChange={(e) => setPrecioVenta(parseFloat(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Costo ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={costo}
                  onChange={(e) => setCosto(parseFloat(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Disponible</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-form btn-primary">
                {editIndex !== null ? "💾 Actualizar Producto" : "➕ Registrar Producto"}
              </button>
              {editIndex !== null && (
                <button 
                  type="button" 
                  className="btn btn-form btn-secondary"
                  onClick={() => {
                    setEditIndex(null);
                    setIdTipoProducto("");
                    setIdUnidadMedida("");
                    setNombreProducto("");
                    setPrecioVenta(0);
                    setCosto(0);
                    setStock(0);
                  }}
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="products-table-container">
          <div className="table-header">
            <h2>📦 Inventario de Productos ({productos.length})</h2>
          </div>
          
          {productos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">No hay productos registrados</div>
              <div className="empty-state-subtext">Comienza agregando tu primer producto usando el formulario de arriba</div>
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Unidad</th>
                  <th>Producto</th>
                  <th>Precio Venta</th>
                  <th>Costo</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto, index) => (
                  <tr key={producto.codigo_producto}>
                    <td><strong>#{producto.codigo_producto}</strong></td>
                    <td>{producto.id_tipo_producto}</td>
                    <td>{producto.id_unidad_medida}</td>
                    <td><strong>{producto.nombre_producto}</strong></td>
                    <td className="currency">${parseFloat(producto.precio_venta).toFixed(2)}</td>
                    <td>${parseFloat(producto.costo).toFixed(2)}</td>
                    <td>
                      <span className={
                        producto.stock <= 5 ? 'stock-low' : 
                        producto.stock <= 20 ? 'stock-medium' : 
                        'stock-high'
                      }>
                        {producto.stock} unidades
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          onClick={() => editarProducto(index)}
                          className="btn btn-table btn-edit"
                          title="Editar producto"
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          onClick={() => eliminarProducto(index)}
                          className="btn btn-table btn-delete"
                          title="Eliminar producto"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductosPage;
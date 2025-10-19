import React, { useState, useEffect } from 'react';
import { 
  clientesService, 
  productosVentaService, 
  mediosPagoService,
  ventasService 
} from '../../services/ventasService';

const NuevaVenta = ({ onVentaCreated }) => {
  // Estados principales
  const [cliente, setCliente] = useState(null);
  const [tipoVenta, setTipoVenta] = useState('efectivo');
  const [carrito, setCarrito] = useState([]);
  const [pagos, setPagos] = useState([]);
  
  // Estados para datos auxiliares
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  
  // Estados para formularios
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);

  // Estado para pago
  const [nuevoPago, setNuevoPago] = useState({
    monto: 0,
    id_medio_pago: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('🔄 Cargando datos iniciales...');
      
      // Cargar clientes
      console.log('📞 Cargando clientes...');
      const clientesData = await clientesService.getAll();
      console.log('✅ Clientes cargados:', clientesData?.length || 0);
      setClientes(clientesData || []);
      
      // Cargar productos
      console.log('📦 Cargando productos...');
      const productosData = await productosVentaService.getAvailable();
      console.log('✅ Productos cargados:', productosData?.length || 0);
      setProductos(productosData || []);
      
      // Cargar medios de pago
      console.log('💳 Cargando medios de pago...');
      const mediosPagoData = await mediosPagoService.getAll();
      console.log('✅ Medios de pago cargados:', mediosPagoData?.length || 0);
      setMediosPago(mediosPagoData || []);

      console.log('✅ Todos los datos iniciales cargados correctamente');
    } catch (error) {
      console.error('❌ Error específico:', error);
      console.error('❌ Stack trace:', error.stack);
      alert('Error al cargar los datos iniciales: ' + error.message);
    }
  };

  const buscarCliente = (termino) => {
    setBusquedaCliente(termino);
  };

  const seleccionarCliente = (clienteSeleccionado) => {
    setCliente(clienteSeleccionado);
    setBusquedaCliente(clienteSeleccionado.nombre_cliente);
  };

  const agregarAlCarrito = () => {
    if (!productoSeleccionado || cantidad <= 0) {
      alert('Selecciona un producto válido y cantidad');
      return;
    }

    const producto = productos.find(p => p.codigo_producto === parseInt(productoSeleccionado));
    
    if (!producto) {
      alert('Producto no encontrado');
      return;
    }

    if (cantidad > producto.stock) {
      alert(`Stock insuficiente. Disponible: ${producto.stock}`);
      return;
    }

    // Verificar si el producto ya está en el carrito
    const itemExistente = carrito.find(item => item.codigo_producto === producto.codigo_producto);
    
    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + cantidad;
      if (nuevaCantidad > producto.stock) {
        alert(`Stock insuficiente. Total disponible: ${producto.stock}, ya tienes ${itemExistente.cantidad} en el carrito`);
        return;
      }
      
      setCarrito(carrito.map(item => 
        item.codigo_producto === producto.codigo_producto
          ? { ...item, cantidad: nuevaCantidad, subtotal: producto.precio_venta * nuevaCantidad }
          : item
      ));
    } else {
      const nuevoItem = {
        codigo_producto: producto.codigo_producto,
        nombre_producto: producto.nombre_producto,
        precio_unitario: producto.precio_venta,
        cantidad: cantidad,
        subtotal: producto.precio_venta * cantidad,
        stock_disponible: producto.stock
      };
      
      setCarrito([...carrito, nuevoItem]);
    }

    // Limpiar formulario
    setProductoSeleccionado('');
    setCantidad(1);
  };

  const eliminarDelCarrito = (codigo_producto) => {
    setCarrito(carrito.filter(item => item.codigo_producto !== codigo_producto));
  };

  const actualizarCantidadCarrito = (codigo_producto, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(codigo_producto);
      return;
    }

    const item = carrito.find(item => item.codigo_producto === codigo_producto);
    if (nuevaCantidad > item.stock_disponible) {
      alert(`Stock insuficiente. Máximo disponible: ${item.stock_disponible}`);
      return;
    }

    setCarrito(carrito.map(item => 
      item.codigo_producto === codigo_producto
        ? { ...item, cantidad: nuevaCantidad, subtotal: item.precio_unitario * nuevaCantidad }
        : item
    ));
  };

  const agregarPago = () => {
    if (!nuevoPago.monto || nuevoPago.monto <= 0 || !nuevoPago.id_medio_pago) {
      alert('Completa todos los campos del pago');
      return;
    }

    const totalPagos = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
    const totalVenta = carrito.reduce((sum, item) => sum + item.subtotal, 0);
    
    if (totalPagos + parseFloat(nuevoPago.monto) > totalVenta) {
      alert('El total de pagos no puede exceder el total de la venta');
      return;
    }

    setPagos([...pagos, { ...nuevoPago, monto: parseFloat(nuevoPago.monto) }]);
    setNuevoPago({ monto: 0, id_medio_pago: '' });
  };

  const eliminarPago = (index) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const calcularTotales = () => {
    const subtotal = carrito.reduce((sum, item) => sum + item.subtotal, 0);
    const totalPagos = pagos.reduce((sum, pago) => sum + pago.monto, 0);
    const pendiente = subtotal - totalPagos;
    
    return { subtotal, totalPagos, pendiente };
  };

  const procesarVenta = async () => {
    if (!cliente) {
      alert('Selecciona un cliente');
      return;
    }

    if (carrito.length === 0) {
      alert('Agrega productos al carrito');
      return;
    }

    const { pendiente } = calcularTotales();

    if (tipoVenta === 'efectivo' && pendiente > 0) {
      alert('Debe completar el pago para ventas en efectivo');
      return;
    }

    const ventaData = {
      id_cliente: cliente.id,
      tipo_venta: tipoVenta,
      detalles: carrito.map(item => ({
        codigo_producto: item.codigo_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      })),
      pagos: pagos.map(pago => ({
        monto: pago.monto,
        id_medio_pago: pago.id_medio_pago,
        id_entidad_financiera: 1 // Por defecto
      }))
    };

    setLoading(true);
    
    try {
      const result = await ventasService.create(ventaData);
      alert(`Venta creada exitosamente. Número: ${result.numero_venta}`);
      
      // Limpiar formulario
      setCliente(null);
      setBusquedaCliente('');
      setCarrito([]);
      setPagos([]);
      setTipoVenta('efectivo');
      
      // Recargar productos para actualizar stock
      const productosActualizados = await productosVentaService.getAvailable();
      setProductos(productosActualizados);
      
      onVentaCreated();
    } catch (error) {
      console.error('Error al crear venta:', error);
      alert('Error al procesar la venta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, totalPagos, pendiente } = calcularTotales();

  return (
    <div className="nueva-venta">
      <div className="venta-form">
        {/* Selección de Cliente */}
        <div className="seccion cliente-seccion">
          <h3>👤 Cliente</h3>
          <div className="cliente-form">
            <input
              type="text"
              className="form-input"
              placeholder="Buscar cliente por nombre o documento..."
              value={busquedaCliente}
              onChange={(e) => buscarCliente(e.target.value)}
            />
            
            {busquedaCliente.length >= 3 && !cliente && (
              <div className="clientes-sugerencias">
                {clientes
                  .filter(c => 
                    c.nombre_cliente.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
                    c.numero_documento.includes(busquedaCliente)
                  )
                  .slice(0, 5)
                  .map(c => (
                    <div 
                      key={c.id} 
                      className="sugerencia-item"
                      onClick={() => seleccionarCliente(c)}
                    >
                      <strong>{c.nombre_cliente}</strong> - {c.numero_documento}
                    </div>
                  ))
                }
              </div>
            )}
            
            {cliente && (
              <div className="cliente-seleccionado">
                <div className="cliente-info">
                  <strong>{cliente.nombre_cliente}</strong>
                  <p>Documento: {cliente.numero_documento}</p>
                  <p>Dirección: {cliente.direccion_cliente}</p>
                </div>
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setCliente(null);
                    setBusquedaCliente('');
                  }}
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tipo de Venta */}
        <div className="seccion tipo-venta-seccion">
          <h3>💳 Tipo de Venta</h3>
          <div className="tipo-venta-options">
            {['efectivo', 'credito', 'debito', 'online'].map(tipo => (
              <label key={tipo} className="radio-option">
                <input
                  type="radio"
                  name="tipoVenta"
                  value={tipo}
                  checked={tipoVenta === tipo}
                  onChange={(e) => setTipoVenta(e.target.value)}
                />
                <span className="radio-label">{tipo.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Agregar Productos */}
        <div className="seccion productos-seccion">
          <h3>📦 Agregar Productos</h3>
          <div className="producto-form">
            <select
              className="form-input"
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar producto...</option>
              {productos.map(producto => (
                <option key={producto.codigo_producto} value={producto.codigo_producto}>
                  {producto.nombre_producto} - ${producto.precio_venta.toFixed(2)} (Stock: {producto.stock})
                </option>
              ))}
            </select>
            
            <input
              type="number"
              className="form-input cantidad-input"
              placeholder="Cantidad"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
            />
            
            <button 
              className="btn btn-primary"
              onClick={agregarAlCarrito}
              disabled={!productoSeleccionado}
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Carrito */}
        {carrito.length > 0 && (
          <div className="seccion carrito-seccion">
            <h3>🛒 Carrito de Compras</h3>
            <div className="carrito-items">
              {carrito.map(item => (
                <div key={item.codigo_producto} className="carrito-item">
                  <div className="item-info">
                    <strong>{item.nombre_producto}</strong>
                    <p>${item.precio_unitario.toFixed(2)} x {item.cantidad} = ${item.subtotal.toFixed(2)}</p>
                  </div>
                  <div className="item-actions">
                    <input
                      type="number"
                      min="1"
                      max={item.stock_disponible}
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidadCarrito(
                        item.codigo_producto, 
                        parseInt(e.target.value) || 1
                      )}
                      className="cantidad-input-small"
                    />
                    <button 
                      className="btn btn-delete btn-small"
                      onClick={() => eliminarDelCarrito(item.codigo_producto)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagos */}
        {carrito.length > 0 && (
          <div className="seccion pagos-seccion">
            <h3>💰 Pagos</h3>
            
            <div className="pago-form">
              <input
                type="number"
                className="form-input"
                placeholder="Monto"
                step="0.01"
                min="0"
                value={nuevoPago.monto}
                onChange={(e) => setNuevoPago({
                  ...nuevoPago, 
                  monto: parseFloat(e.target.value) || 0
                })}
              />
              
              <select
                className="form-input"
                value={nuevoPago.id_medio_pago}
                onChange={(e) => setNuevoPago({
                  ...nuevoPago, 
                  id_medio_pago: e.target.value
                })}
              >
                <option value="">Medio de pago...</option>
                {mediosPago.map(medio => (
                  <option key={medio.id} value={medio.id}>
                    {medio.nombre_medio_pago}
                  </option>
                ))}
              </select>
              
              <button 
                className="btn btn-secondary"
                onClick={agregarPago}
                disabled={!nuevoPago.monto || !nuevoPago.id_medio_pago}
              >
                Agregar Pago
              </button>
            </div>

            {pagos.length > 0 && (
              <div className="pagos-lista">
                {pagos.map((pago, index) => (
                  <div key={index} className="pago-item">
                    <span>
                      ${pago.monto.toFixed(2)} - {
                        mediosPago.find(m => m.id === parseInt(pago.id_medio_pago))?.nombre_medio_pago
                      }
                    </span>
                    <button 
                      className="btn btn-delete btn-small"
                      onClick={() => eliminarPago(index)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resumen */}
        {carrito.length > 0 && (
          <div className="seccion resumen-seccion">
            <h3>📊 Resumen de Venta</h3>
            <div className="resumen">
              <div className="resumen-linea">
                <span>Subtotal:</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>
              <div className="resumen-linea">
                <span>Total Pagos:</span>
                <strong>${totalPagos.toFixed(2)}</strong>
              </div>
              <div className={`resumen-linea ${pendiente > 0 ? 'pendiente' : 'completo'}`}>
                <span>Pendiente:</span>
                <strong>${pendiente.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        {carrito.length > 0 && (
          <div className="seccion acciones-seccion">
            <button 
              className="btn btn-success btn-large"
              onClick={procesarVenta}
              disabled={loading || !cliente}
            >
              {loading ? 'Procesando...' : '✅ Procesar Venta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NuevaVenta;
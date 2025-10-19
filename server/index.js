const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import the database connection (OLTP)
const dwDb = require('./db-dw'); // Import Data Warehouse connection (BI)

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware para validar JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next();
});

// Test route to check if the server is running
app.get('/api/productos', (req, res) => {
    const query = 'SELECT * FROM producto'; // Adjust the table name as needed
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los productos:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        return res.json(results);
    });
});

// crear un producto
app.post('/api/productos', (req, res) => {
    const { id_tipo_producto, id_unidad_medida, nombre_producto, precio_venta, costo, stock } = req.body;
    const query = 'INSERT INTO producto (id_tipo_producto, id_unidad_medida, nombre_producto, precio_venta, costo, stock) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [id_tipo_producto, id_unidad_medida, nombre_producto, precio_venta, costo, stock], (err, results) => {
        if (err) {
            console.error('Error al crear el producto:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Obtener el producto creado
        const getQuery = 'SELECT * FROM producto WHERE codigo_producto = ?';
        db.query(getQuery, [results.insertId], (err, productResult) => {
            if (err) {
                console.error('Error al obtener el producto creado:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            return res.json(productResult[0]);
        });
    });
});

//Actualizar un producto
app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { id_tipo_producto, id_unidad_medida, nombre_producto, precio_venta, costo, stock } = req.body;
    const query = 'UPDATE producto SET id_tipo_producto = ?, id_unidad_medida = ?, nombre_producto = ?, precio_venta = ?, costo = ?, stock = ? WHERE codigo_producto = ?';
    db.query(query, [id_tipo_producto, id_unidad_medida, nombre_producto, precio_venta, costo, stock, id], (err, results) => {
        if (err) {
            console.error('Error al actualizar el producto:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        return res.json({ message: 'Producto actualizado exitosamente', affectedRows: results.affectedRows });
    });
});

// Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM producto WHERE codigo_producto = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al eliminar el producto:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        return res.json({ message: 'Producto eliminado exitosamente', affectedRows: results.affectedRows });
    });
});

// ===== RUTAS PARA TIPOS DE PRODUCTO Y UNIDADES DE MEDIDA =====

// Obtener todos los tipos de producto
app.get('/api/tipos-producto', (req, res) => {
    console.log('📋 Obteniendo tipos de producto...');
    const query = 'SELECT * FROM tipo_producto ORDER BY nombre_tipo_producto';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener tipos de producto:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ Tipos de producto encontrados: ${results.length}`);
        return res.json(results);
    });
});

// Obtener todas las unidades de medida
app.get('/api/unidades-medida', (req, res) => {
    console.log('📦 Obteniendo unidades de medida...');
    const query = 'SELECT * FROM unidad_medida ORDER BY nombre_unidad_medida';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener unidades de medida:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ Unidades de medida encontradas: ${results.length}`);
        return res.json(results);
    });
});

// Crear nuevo tipo de producto
app.post('/api/tipos-producto', (req, res) => {
    const { nombre_tipo } = req.body;
    console.log(`➕ Creando tipo de producto: ${nombre_tipo}`);
    
    const query = 'INSERT INTO tipo_producto (nombre_tipo) VALUES (?)';
    
    db.query(query, [nombre_tipo], (err, results) => {
        if (err) {
            console.error('❌ Error al crear tipo de producto:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Obtener el tipo creado
        const getQuery = 'SELECT * FROM tipo_producto WHERE id = ?';
        db.query(getQuery, [results.insertId], (err, tipoResult) => {
            if (err) {
                console.error('❌ Error al obtener el tipo creado:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            console.log('✅ Tipo de producto creado exitosamente');
            return res.json(tipoResult[0]);
        });
    });
});

// Crear nueva unidad de medida
app.post('/api/unidades-medida', (req, res) => {
    const { nombre_unidad } = req.body;
    console.log(`➕ Creando unidad de medida: ${nombre_unidad}`);
    
    const query = 'INSERT INTO unidad_medida (nombre_unidad) VALUES (?)';
    
    db.query(query, [nombre_unidad], (err, results) => {
        if (err) {
            console.error('❌ Error al crear unidad de medida:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Obtener la unidad creada
        const getQuery = 'SELECT * FROM unidad_medida WHERE id = ?';
        db.query(getQuery, [results.insertId], (err, unidadResult) => {
            if (err) {
                console.error('❌ Error al obtener la unidad creada:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            console.log('✅ Unidad de medida creada exitosamente');
            return res.json(unidadResult[0]);
        });
    });
});

// ===== RUTAS PARA CLIENTES =====

// Obtener todos los clientes con información relacionada
app.get('/api/clientes', (req, res) => {
    const query = `
        SELECT 
            c.id,
            c.nombre_cliente,
            c.direccion_cliente,
            c.genero_cliente,
            c.numero_documento,
            c.fecha_nacimiento,
            c.email,
            td.nombre_tipo_documento,
            m.nombre_municipio
        FROM cliente c
        LEFT JOIN tipo_documento td ON c.id_tipo_documento = td.id
        LEFT JOIN municipio m ON c.id_municipio = m.id
        ORDER BY c.nombre_cliente
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los clientes:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        return res.json(results);
    });
});

// Obtener un cliente específico con sus teléfonos
app.get('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    
    const clienteQuery = `
        SELECT 
            c.id,
            c.nombre_cliente,
            c.direccion_cliente,
            c.genero_cliente,
            c.numero_documento,
            c.fecha_nacimiento,
            c.email,
            c.id_tipo_documento,
            c.id_municipio,
            td.nombre_tipo_documento,
            m.nombre_municipio
        FROM cliente c
        LEFT JOIN tipo_documento td ON c.id_tipo_documento = td.id
        LEFT JOIN municipio m ON c.id_municipio = m.id
        WHERE c.id = ?
    `;
    
    const telefonosQuery = `
        SELECT id, numero_telefono, tipo_telefono, ubicacion_telefono
        FROM telefono
        WHERE id_cliente = ?
    `;
    
    db.query(clienteQuery, [id], (err, clienteResults) => {
        if (err) {
            console.error('Error al obtener el cliente:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (clienteResults.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        db.query(telefonosQuery, [id], (err, telefonosResults) => {
            if (err) {
                console.error('Error al obtener los teléfonos:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            const cliente = {
                ...clienteResults[0],
                telefonos: telefonosResults
            };
            
            return res.json(cliente);
        });
    });
});

// Crear un nuevo cliente
app.post('/api/clientes', (req, res) => {
    const { 
        nombre_cliente, 
        direccion_cliente, 
        genero_cliente, 
        numero_documento, 
        id_tipo_documento, 
        id_municipio,
        fecha_nacimiento,
        email,
        telefonos = []
    } = req.body;
    
    // Validaciones básicas
    if (!nombre_cliente || !numero_documento || !id_tipo_documento || !id_municipio) {
        return res.status(400).json({ 
            error: 'Faltan campos requeridos: nombre_cliente, numero_documento, id_tipo_documento, id_municipio' 
        });
    }
    
    const insertClienteQuery = `
        INSERT INTO cliente (
            nombre_cliente, 
            direccion_cliente, 
            genero_cliente, 
            numero_documento, 
            id_tipo_documento, 
            id_municipio,
            fecha_nacimiento,
            email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(insertClienteQuery, [
        nombre_cliente, 
        direccion_cliente, 
        genero_cliente, 
        numero_documento, 
        id_tipo_documento, 
        id_municipio,
        fecha_nacimiento,
        email
    ], (err, results) => {
        if (err) {
            console.error('Error al crear el cliente:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'El número de documento ya existe' });
            }
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        const clienteId = results.insertId;
        
        // Si hay teléfonos, insertarlos
        if (telefonos.length > 0) {
            const telefonosValues = telefonos.map(tel => [
                tel.numero_telefono,
                tel.tipo_telefono,
                tel.ubicacion_telefono,
                clienteId
            ]);
            
            const insertTelefonosQuery = `
                INSERT INTO telefono (numero_telefono, tipo_telefono, ubicacion_telefono, id_cliente) 
                VALUES ?
            `;
            
            db.query(insertTelefonosQuery, [telefonosValues], (err) => {
                if (err) {
                    console.error('Error al insertar teléfonos:', err);
                    // El cliente ya fue creado, solo reportamos el error de teléfonos
                }
                
                return res.status(201).json({ 
                    message: 'Cliente creado exitosamente',
                    id: clienteId
                });
            });
        } else {
            return res.status(201).json({ 
                message: 'Cliente creado exitosamente',
                id: clienteId
            });
        }
    });
});

// Actualizar un cliente
app.put('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const { 
        nombre_cliente, 
        direccion_cliente, 
        genero_cliente, 
        numero_documento, 
        id_tipo_documento, 
        id_municipio,
        fecha_nacimiento,
        email
    } = req.body;
    
    const updateQuery = `
        UPDATE cliente SET 
            nombre_cliente = ?, 
            direccion_cliente = ?, 
            genero_cliente = ?, 
            numero_documento = ?, 
            id_tipo_documento = ?, 
            id_municipio = ?,
            fecha_nacimiento = ?,
            email = ?
        WHERE id = ?
    `;
    
    db.query(updateQuery, [
        nombre_cliente, 
        direccion_cliente, 
        genero_cliente, 
        numero_documento, 
        id_tipo_documento, 
        id_municipio,
        fecha_nacimiento,
        email,
        id
    ], (err, results) => {
        if (err) {
            console.error('Error al actualizar el cliente:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'El número de documento ya existe' });
            }
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        return res.json({ 
            message: 'Cliente actualizado exitosamente', 
            affectedRows: results.affectedRows 
        });
    });
});

// Eliminar un cliente
app.delete('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    
    // Primero eliminar teléfonos asociados
    const deleteTelefonosQuery = 'DELETE FROM telefono WHERE id_cliente = ?';
    
    db.query(deleteTelefonosQuery, [id], (err) => {
        if (err) {
            console.error('Error al eliminar teléfonos:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Luego eliminar el cliente
        const deleteClienteQuery = 'DELETE FROM cliente WHERE id = ?';
        
        db.query(deleteClienteQuery, [id], (err, results) => {
            if (err) {
                console.error('Error al eliminar el cliente:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            
            return res.json({ 
                message: 'Cliente eliminado exitosamente', 
                affectedRows: results.affectedRows 
            });
        });
    });
});

// ===== RUTAS PARA DATOS AUXILIARES =====

// Obtener tipos de documento
app.get('/api/tipos-documento', (req, res) => {
    const query = 'SELECT id, nombre_tipo_documento FROM tipo_documento ORDER BY nombre_tipo_documento';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener tipos de documento:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        return res.json(results);
    });
});

// Obtener municipios
app.get('/api/municipios', (req, res) => {
    const query = 'SELECT id, nombre_municipio FROM municipio ORDER BY nombre_municipio';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener municipios:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        return res.json(results);
    });
});

// ===== RUTAS PARA TELÉFONOS =====

// Agregar teléfono a un cliente
app.post('/api/clientes/:id/telefonos', (req, res) => {
    const { id } = req.params;
    const { numero_telefono, tipo_telefono, ubicacion_telefono } = req.body;
    
    if (!numero_telefono || !tipo_telefono) {
        return res.status(400).json({ 
            error: 'Faltan campos requeridos: numero_telefono, tipo_telefono' 
        });
    }
    
    const query = `
        INSERT INTO telefono (numero_telefono, tipo_telefono, ubicacion_telefono, id_cliente) 
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(query, [numero_telefono, tipo_telefono, ubicacion_telefono, id], (err, results) => {
        if (err) {
            console.error('Error al crear el teléfono:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        return res.status(201).json({ 
            message: 'Teléfono agregado exitosamente',
            id: results.insertId
        });
    });
});

// Eliminar teléfono
app.delete('/api/telefonos/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM telefono WHERE id = ?';
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al eliminar el teléfono:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Teléfono no encontrado' });
        }
        
        return res.json({ 
            message: 'Teléfono eliminado exitosamente', 
            affectedRows: results.affectedRows 
        });
    });
});

// ===== RUTAS PARA VENTAS =====

// Obtener todas las ventas con información del cliente
app.get('/api/ventas', (req, res) => {
    console.log('📥 GET /api/ventas - Solicitud recibida');
    const query = `
        SELECT 
            v.numero_venta,
            v.fecha_venta,
            v.tipo_venta,
            v.total_venta,
            c.nombre_cliente,
            c.numero_documento,
            COUNT(dv.id) as total_items
        FROM venta v
        LEFT JOIN cliente c ON v.id_cliente = c.id
        LEFT JOIN detalle_venta dv ON v.numero_venta = dv.numero_venta
        GROUP BY v.numero_venta, v.fecha_venta, v.tipo_venta, v.total_venta, c.nombre_cliente, c.numero_documento
        ORDER BY v.fecha_venta DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener las ventas:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ Ventas encontradas: ${results.length}`);
        return res.json(results);
    });
});

// Obtener una venta específica con todos los detalles
app.get('/api/ventas/:numero_venta', (req, res) => {
    const { numero_venta } = req.params;
    
    const ventaQuery = `
        SELECT 
            v.numero_venta,
            v.fecha_venta,
            v.tipo_venta,
            v.total_venta,
            v.id_cliente,
            c.nombre_cliente,
            c.numero_documento,
            c.direccion_cliente
        FROM venta v
        LEFT JOIN cliente c ON v.id_cliente = c.id
        WHERE v.numero_venta = ?
    `;
    
    const detallesQuery = `
        SELECT 
            dv.id,
            dv.codigo_producto,
            dv.item,
            dv.precio_unitario,
            dv.subtotal,
            ROUND(dv.subtotal / dv.precio_unitario) as cantidad,
            p.nombre_producto,
            p.stock as stock_actual
        FROM detalle_venta dv
        LEFT JOIN producto p ON dv.codigo_producto = p.codigo_producto
        WHERE dv.numero_venta = ?
        ORDER BY dv.id
    `;
    
    const pagosQuery = `
        SELECT 
            p.fecha_pago,
            p.id_medio_pago,
            p.id_entidad_financiera,
            mp.nombre_medio_pago,
            ef.nombre_entidad_financiera,
            v.total_venta as monto
        FROM pago p
        LEFT JOIN medio_pago mp ON p.id_medio_pago = mp.id
        LEFT JOIN entidad_financiera ef ON p.id_entidad_financiera = ef.id
        LEFT JOIN venta v ON p.numero_venta = v.numero_venta
        WHERE p.numero_venta = ?
    `;
    
    db.query(ventaQuery, [numero_venta], (err, ventaResults) => {
        if (err) {
            console.error('Error al obtener la venta:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (ventaResults.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        db.query(detallesQuery, [numero_venta], (err, detallesResults) => {
            if (err) {
                console.error('Error al obtener los detalles:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            db.query(pagosQuery, [numero_venta], (err, pagosResults) => {
                if (err) {
                    console.error('Error al obtener los pagos:', err);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }
                
                const venta = {
                    ...ventaResults[0],
                    detalles: detallesResults,
                    pagos: pagosResults
                };
                
                return res.json(venta);
            });
        });
    });
});

// Crear una nueva venta (transacción completa)
app.post('/api/ventas', async (req, res) => {
    console.log('📥 POST /api/ventas - Nueva venta recibida:', req.body);
    
    const { 
        id_cliente, 
        tipo_venta, 
        detalles, 
        pagos = [] 
    } = req.body;
    
    // Validaciones básicas
    if (!id_cliente || !tipo_venta || !detalles || detalles.length === 0) {
        console.log('❌ Validación fallida: campos requeridos faltantes');
        return res.status(400).json({ 
            error: 'Faltan campos requeridos: id_cliente, tipo_venta, detalles' 
        });
    }
    
    // Calcular total de la venta
    const total_venta = detalles.reduce((total, detalle) => {
        return total + (detalle.precio_unitario * detalle.cantidad);
    }, 0);
    
    console.log(`💰 Total de la venta calculado: $${total_venta}`);
    
    try {
        // Iniciar transacción
        await new Promise((resolve, reject) => {
            db.beginTransaction((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('🔄 Transacción iniciada');
        
        // 1. Insertar la venta
        const ventaResult = await new Promise((resolve, reject) => {
            const insertVentaQuery = `
                INSERT INTO venta (fecha_venta, tipo_venta, total_venta, id_cliente) 
                VALUES (NOW(), ?, ?, ?)
            `;
            
            db.query(insertVentaQuery, [tipo_venta, total_venta, id_cliente], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        const numero_venta = ventaResult.insertId;
        console.log(`✅ Venta creada con número: ${numero_venta}`);
        
        // 2. Procesar detalles secuencialmente
        for (let i = 0; i < detalles.length; i++) {
            const detalle = detalles[i];
            const { codigo_producto, cantidad, precio_unitario } = detalle;
            
            console.log(`📦 Procesando producto ${codigo_producto} - Cantidad: ${cantidad}`);
            
            // Verificar stock
            const stockResult = await new Promise((resolve, reject) => {
                const stockQuery = 'SELECT stock, nombre_producto FROM producto WHERE codigo_producto = ?';
                db.query(stockQuery, [codigo_producto], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            if (stockResult.length === 0) {
                throw new Error(`Producto ${codigo_producto} no encontrado`);
            }
            
            if (stockResult[0].stock < cantidad) {
                throw new Error(`Stock insuficiente para ${stockResult[0].nombre_producto}. Disponible: ${stockResult[0].stock}, Solicitado: ${cantidad}`);
            }
            
            // Insertar detalle
            const subtotal = precio_unitario * cantidad;
            await new Promise((resolve, reject) => {
                const insertDetalleQuery = `
                    INSERT INTO detalle_venta (codigo_producto, item, precio_unitario, subtotal, numero_venta) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                db.query(insertDetalleQuery, [
                    codigo_producto, 
                    stockResult[0].nombre_producto, 
                    precio_unitario, 
                    subtotal, 
                    numero_venta
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            // Actualizar stock
            await new Promise((resolve, reject) => {
                const updateStockQuery = `UPDATE producto SET stock = stock - ? WHERE codigo_producto = ?`;
                db.query(updateStockQuery, [cantidad, codigo_producto], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            console.log(`✅ Producto ${codigo_producto} procesado correctamente`);
        }
        
        // 3. Procesar pagos si existen
        if (pagos.length > 0) {
            console.log(`💳 Procesando ${pagos.length} pagos`);
            
            for (let i = 0; i < pagos.length; i++) {
                const pago = pagos[i];
                await new Promise((resolve, reject) => {
                    const insertPagoQuery = `
                        INSERT INTO pago (fecha_pago, id_entidad_financiera, id_medio_pago, numero_venta) 
                        VALUES (NOW(), ?, ?, ?)
                    `;
                    
                    db.query(insertPagoQuery, [
                        pago.id_entidad_financiera, 
                        pago.id_medio_pago, 
                        numero_venta
                    ], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            }
            
            console.log('✅ Todos los pagos procesados');
        }
        
        // 4. Confirmar transacción
        await new Promise((resolve, reject) => {
            db.commit((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Transacción confirmada exitosamente');
        
        res.status(201).json({ 
            message: 'Venta creada exitosamente',
            numero_venta: numero_venta,
            total_venta: total_venta
        });
        
    } catch (error) {
        console.error('❌ Error en la transacción:', error);
        
        // Rollback en caso de error
        db.rollback(() => {
            console.log('🔄 Rollback ejecutado');
            res.status(400).json({ 
                error: error.message || 'Error al procesar la venta' 
            });
        });
    }
});

// Cancelar/Anular una venta (restaurar stock)
app.delete('/api/ventas/:numero_venta', (req, res) => {
    const { numero_venta } = req.params;
    
    // Iniciar transacción
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Obtener detalles para restaurar stock
        const detallesQuery = `
            SELECT dv.codigo_producto, 
                   (dv.subtotal / dv.precio_unitario) as cantidad
            FROM detalle_venta dv 
            WHERE dv.numero_venta = ?
        `;
        
        db.query(detallesQuery, [numero_venta], (err, detalles) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error al obtener detalles:', err);
                    res.status(500).json({ error: 'Error interno del servidor' });
                });
            }
            
            // Restaurar stock
            let stockUpdated = 0;
            
            if (detalles.length === 0) {
                // No hay detalles, proceder con eliminación
                proceedWithDeletion();
            } else {
                detalles.forEach((detalle) => {
                    const updateStockQuery = `
                        UPDATE producto 
                        SET stock = stock + ? 
                        WHERE codigo_producto = ?
                    `;
                    
                    db.query(updateStockQuery, [detalle.cantidad, detalle.codigo_producto], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error al restaurar stock:', err);
                                res.status(500).json({ error: 'Error al restaurar stock' });
                            });
                        }
                        
                        stockUpdated++;
                        
                        if (stockUpdated === detalles.length) {
                            proceedWithDeletion();
                        }
                    });
                });
            }
            
            function proceedWithDeletion() {
                // Eliminar pagos
                const deletePagosQuery = 'DELETE FROM pago WHERE numero_venta = ?';
                db.query(deletePagosQuery, [numero_venta], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al eliminar pagos:', err);
                            res.status(500).json({ error: 'Error al eliminar pagos' });
                        });
                    }
                    
                    // Eliminar detalles
                    const deleteDetallesQuery = 'DELETE FROM detalle_venta WHERE numero_venta = ?';
                    db.query(deleteDetallesQuery, [numero_venta], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error al eliminar detalles:', err);
                                res.status(500).json({ error: 'Error al eliminar detalles' });
                            });
                        }
                        
                        // Eliminar venta
                        const deleteVentaQuery = 'DELETE FROM venta WHERE numero_venta = ?';
                        db.query(deleteVentaQuery, [numero_venta], (err, result) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error al eliminar venta:', err);
                                    res.status(500).json({ error: 'Error al eliminar venta' });
                                });
                            }
                            
                            if (result.affectedRows === 0) {
                                return db.rollback(() => {
                                    res.status(404).json({ error: 'Venta no encontrada' });
                                });
                            }
                            
                            // Confirmar transacción
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('Error al confirmar eliminación:', err);
                                        res.status(500).json({ error: 'Error al confirmar eliminación' });
                                    });
                                }
                                
                                res.json({ 
                                    message: 'Venta cancelada exitosamente',
                                    stock_restaurado: detalles.length > 0 
                                });
                            });
                        });
                    });
                });
            }
        });
    });
});

// ===== RUTAS AUXILIARES PARA VENTAS =====

// Obtener productos disponibles para venta (con stock > 0)
app.get('/api/productos-venta', (req, res) => {
    const query = `
        SELECT 
            codigo_producto,
            nombre_producto,
            precio_venta,
            costo,
            stock,
            tp.nombre_tipo_producto,
            um.nombre_unidad_medida
        FROM producto p
        LEFT JOIN tipo_producto tp ON p.id_tipo_producto = tp.id
        LEFT JOIN unidad_medida um ON p.id_unidad_medida = um.id
        WHERE p.stock > 0
        ORDER BY p.nombre_producto
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener productos para venta:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        return res.json(results);
    });
});

// Obtener medios de pago
app.get('/api/medios-pago', (req, res) => {
    const query = 'SELECT id, nombre_medio_pago FROM medio_pago ORDER BY nombre_medio_pago';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener medios de pago:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        return res.json(results);
    });
});

// Obtener entidades financieras
app.get('/api/entidades-financieras', (req, res) => {
    const query = 'SELECT id, nombre_entidad_financiera FROM entidad_financiera ORDER BY nombre_entidad_financiera';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener entidades financieras:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        return res.json(results);
    });
});

// Obtener estadísticas de ventas
app.get('/api/ventas/stats/resumen', (req, res) => {
    console.log('📊 GET /api/ventas/stats/resumen - Solicitud recibida');
    const query = `
        SELECT 
            COUNT(*) as total_ventas,
            COALESCE(SUM(total_venta), 0) as total_ingresos,
            COALESCE(AVG(total_venta), 0) as promedio_venta,
            COUNT(CASE WHEN DATE(fecha_venta) = CURDATE() THEN 1 END) as ventas_hoy,
            COALESCE(SUM(CASE WHEN DATE(fecha_venta) = CURDATE() THEN total_venta END), 0) as ingresos_hoy
        FROM venta
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener estadísticas:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log('✅ Estadísticas calculadas:', results[0]);
        return res.json(results[0]);
    });
});

// =====================================================
// 🔥 ENDPOINTS DE REPORTES BI (DATA WAREHOUSE)
// =====================================================

// 📊 Dashboard General (desde DW)
app.get('/api/reportes/dashboard', (req, res) => {
    console.log('📊 [DW] Generando dashboard general...');
    
    const dashboardQuery = `
        SELECT 
            -- Ventas de hoy (desde fact_ventas)
            (SELECT COALESCE(SUM(fv.total_linea), 0) 
             FROM fact_ventas fv 
             JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key 
             WHERE dt.fecha = CURDATE()) as ventas_hoy,
            
            -- Ventas del mes actual
            (SELECT COALESCE(SUM(fv.total_linea), 0) 
             FROM fact_ventas fv 
             JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key 
             WHERE dt.mes = MONTH(CURDATE()) AND dt.año = YEAR(CURDATE())) as ventas_mes,
            
            -- Total de ventas históricas
            (SELECT COALESCE(SUM(total_linea), 0) FROM fact_ventas) as ventasTotal,
            
            -- Productos en stock (desde dimensión)
            (SELECT COUNT(*) FROM dim_producto WHERE stock_actual > 0) as productosEnStock,
            (SELECT COUNT(*) FROM dim_producto WHERE stock_actual <= 10) as productosBajoStock,
            (SELECT COUNT(*) FROM dim_producto WHERE stock_actual = 0) as productosSinStock,
            
            -- Clientes activos (últimos 30 días)
            (SELECT COUNT(DISTINCT fv.cliente_key) 
             FROM fact_ventas fv 
             JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key
             WHERE dt.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as clientesActivos,
            
            -- Total de clientes
            (SELECT COUNT(*) FROM dim_cliente) as totalClientes,
            
            -- Número de transacciones hoy
            (SELECT COUNT(DISTINCT fv.numero_venta_original) 
             FROM fact_ventas fv 
             JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key 
             WHERE dt.fecha = CURDATE()) as ventasHoy,
            
            -- Ticket promedio
            (SELECT AVG(total_linea) FROM fact_ventas) as promedioVenta,
            
            -- Utilidad total
            (SELECT COALESCE(SUM(utilidad_linea), 0) FROM fact_ventas) as utilidadTotal,
            
            -- Margen promedio
            (SELECT AVG(margen_linea) FROM fact_ventas WHERE margen_linea > 0) as margenPromedio
    `;

    dwDb.query(dashboardQuery, (err, results) => {
        if (err) {
            console.error('❌ Error al generar dashboard desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log('✅ Dashboard DW generado exitosamente');
        return res.json(results[0]);
    });
});

// ⚠️ Productos con Stock Bajo (desde DW)
app.get('/api/reportes/stock-bajo', (req, res) => {
    const stockMinimo = req.query.minimo || 10;
    console.log(`⚠️ [DW] Generando reporte de stock bajo (mínimo: ${stockMinimo})`);

    const query = `
        SELECT 
            codigo_producto,
            nombre_producto,
            stock_actual as stock,
            precio_actual as precio_venta,
            costo_actual as costo,
            ${stockMinimo} as stock_minimo,
            categoria_stock,
            tipo_producto,
            unidad_medida,
            CASE 
                WHEN stock_actual = 0 THEN 'Agotado'
                WHEN stock_actual <= 5 THEN 'Crítico'
                ELSE 'Bajo'
            END as estado,
            margen_actual as margen_porcentaje
        FROM dim_producto 
        WHERE stock_actual <= ?
        ORDER BY stock_actual ASC, nombre_producto
    `;

    dwDb.query(query, [stockMinimo], (err, results) => {
        if (err) {
            console.error('❌ Error al obtener productos con stock bajo desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ [DW] Encontrados ${results.length} productos con stock bajo`);
        return res.json({ productos: results });
    });
});

// 📅 Productos Próximos a Vencer (desde DW - con fechas estimadas)
app.get('/api/reportes/proximos-vencer', (req, res) => {
    const diasLimite = req.query.dias || 60;
    console.log(`📅 [DW] Generando reporte de productos próximos a vencer (${diasLimite} días)`);

    // Generar datos estimados basados en rotación de productos
    const query = `
        SELECT 
            dp.codigo_producto,
            dp.nombre_producto,
            dp.tipo_producto,
            dp.stock_actual,
            DATE_ADD(CURDATE(), INTERVAL (dp.producto_key % 60) DAY) as fecha_vencimiento_estimada,
            (dp.producto_key % 60) as dias_restantes,
            CASE 
                WHEN (dp.producto_key % 60) <= 15 THEN 'Alta'
                WHEN (dp.producto_key % 60) <= 30 THEN 'Media'
                ELSE 'Baja'
            END as urgencia,
            dp.precio_actual * dp.stock_actual as valor_inventario
        FROM dim_producto dp
        WHERE dp.stock_actual > 0
          AND dp.tipo_producto IN ('Bebidas', 'Alimentos procesados', 'Lácteos y huevos', 'Carnes frías', 'Frutas y verduras', 'Panadería')
          AND (dp.producto_key % 60) <= ?
        ORDER BY dias_restantes ASC, valor_inventario DESC
        LIMIT 20
    `;

    dwDb.query(query, [diasLimite], (err, results) => {
        if (err) {
            console.error('❌ Error al obtener productos próximos a vencer desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ [DW] Encontrados ${results.length} productos próximos a vencer (estimación)`);
        return res.json({ 
            productos: results,
            nota: 'Fechas estimadas - Implementar tabla de lotes para fechas reales'
        });
    });
});

// 🚫 Productos Faltantes (Sin Stock - desde DW)
app.get('/api/reportes/faltantes', (req, res) => {
    console.log('🚫 [DW] Generando reporte de productos faltantes');

    const query = `
        SELECT 
            dp.codigo_producto,
            dp.nombre_producto,
            dp.stock_actual as stock,
            dp.precio_actual as precio_venta,
            dp.tipo_producto,
            dp.unidad_medida,
            MAX(fv.fecha_venta_original) as ultima_venta,
            COALESCE(DATEDIFF(CURDATE(), MAX(fv.fecha_venta_original)), 0) as dias_sin_stock,
            SUM(fv.cantidad_vendida) as total_vendido_historico
        FROM dim_producto dp
        LEFT JOIN fact_ventas fv ON dp.producto_key = fv.producto_key
        WHERE dp.stock_actual = 0
        GROUP BY dp.producto_key, dp.codigo_producto, dp.nombre_producto, 
                 dp.stock_actual, dp.precio_actual, dp.tipo_producto, dp.unidad_medida
        ORDER BY ultima_venta DESC, total_vendido_historico DESC
    `;

    dwDb.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener productos faltantes desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ [DW] Encontrados ${results.length} productos faltantes`);
        return res.json({ productos: results });
    });
});

// 👥 Top Clientes que Más Compran (desde DW)
app.get('/api/reportes/top-clientes', (req, res) => {
    const { fechaInicio, fechaFin, limite = 10 } = req.query;
    console.log('👥 [DW] Generando reporte de top clientes');

    let whereClause = '';
    const params = [parseInt(limite)];
    
    if (fechaInicio && fechaFin) {
        whereClause = 'AND dt.fecha BETWEEN ? AND ?';
        params.unshift(fechaFin, fechaInicio);
    }

    const query = `
        SELECT 
            dc.id_cliente_original as id,
            dc.nombre_cliente,
            dc.numero_documento,
            dc.tipo_documento,
            dc.municipio,
            dc.segmento_cliente,
            dc.rango_edad,
            COUNT(DISTINCT fv.numero_venta_original) as numero_ventas,
            COALESCE(SUM(fv.total_linea), 0) as total_compras,
            COALESCE(AVG(fv.total_linea), 0) as promedio_compra,
            SUM(fv.utilidad_linea) as utilidad_generada,
            MAX(fv.fecha_venta_original) as ultima_compra,
            dc.fecha_primer_compra
        FROM dim_cliente dc
        LEFT JOIN fact_ventas fv ON dc.cliente_key = fv.cliente_key
        LEFT JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key
        WHERE 1=1 ${whereClause}
        GROUP BY dc.cliente_key, dc.id_cliente_original, dc.nombre_cliente, 
                 dc.numero_documento, dc.tipo_documento, dc.municipio,
                 dc.segmento_cliente, dc.rango_edad, dc.fecha_primer_compra
        HAVING total_compras > 0
        ORDER BY total_compras DESC
        LIMIT ?
    `;

    dwDb.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener top clientes desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ [DW] Generados top ${results.length} clientes`);
        return res.json({ clientes: results });
    });
});

// 📦 Top Productos Más Vendidos (desde DW)
app.get('/api/reportes/top-productos', (req, res) => {
    const { fechaInicio, fechaFin, limite = 10 } = req.query;
    console.log('📦 [DW] Generando reporte de productos más vendidos');

    let whereClause = '';
    const params = [parseInt(limite)];
    
    if (fechaInicio && fechaFin) {
        whereClause = 'AND dt.fecha BETWEEN ? AND ?';
        params.unshift(fechaFin, fechaInicio);
    }

    const query = `
        SELECT 
            dp.codigo_producto,
            dp.nombre_producto,
            dp.tipo_producto,
            dp.unidad_medida,
            dp.precio_actual as precio_venta,
            dp.costo_actual as costo,
            dp.stock_actual,
            dp.margen_actual,
            SUM(fv.cantidad_vendida) as cantidad_vendida,
            SUM(fv.total_linea) as ingresos_generados,
            SUM(fv.utilidad_linea) as utilidad_generada,
            AVG(fv.margen_linea) as margen_promedio,
            COUNT(DISTINCT fv.numero_venta_original) as numero_ventas,
            AVG(fv.precio_unitario) as precio_promedio
        FROM dim_producto dp
        INNER JOIN fact_ventas fv ON dp.producto_key = fv.producto_key
        LEFT JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key
        WHERE 1=1 ${whereClause}
        GROUP BY dp.producto_key, dp.codigo_producto, dp.nombre_producto, 
                 dp.tipo_producto, dp.unidad_medida, dp.precio_actual, 
                 dp.costo_actual, dp.stock_actual, dp.margen_actual
        ORDER BY cantidad_vendida DESC
        LIMIT ?
    `;

    dwDb.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener productos más vendidos desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ [DW] Generados top ${results.length} productos más vendidos`);
        return res.json({ productos: results });
    });
});

// 🏘️ Ventas por Municipio (desde DW)
app.get('/api/reportes/ventas-municipio', (req, res) => {
    const { fechaInicio, fechaFin } = req.query;
    console.log('🏘️ [DW] Generando reporte de ventas por municipio');

    let whereClause = '';
    const params = [];
    
    if (fechaInicio && fechaFin) {
        whereClause = 'AND dt.fecha BETWEEN ? AND ?';
        params.push(fechaInicio, fechaFin);
    }

    const query = `
        SELECT 
            dc.municipio,
            COUNT(DISTINCT fv.numero_venta_original) as numero_transacciones,
            COUNT(DISTINCT fv.cliente_key) as numero_clientes,
            COALESCE(SUM(fv.total_linea), 0) as total_ventas,
            COALESCE(AVG(fv.total_linea), 0) as promedio_venta,
            SUM(fv.utilidad_linea) as utilidad_total,
            AVG(fv.margen_linea) as margen_promedio,
            MAX(fv.fecha_venta_original) as ultima_venta,
            SUM(fv.cantidad_vendida) as productos_vendidos
        FROM dim_cliente dc
        LEFT JOIN fact_ventas fv ON dc.cliente_key = fv.cliente_key
        LEFT JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key
        WHERE fv.venta_key IS NOT NULL ${whereClause}
        GROUP BY dc.municipio
        HAVING total_ventas > 0
        ORDER BY total_ventas DESC
    `;

    dwDb.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener ventas por municipio desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ [DW] Generadas ventas de ${results.length} municipios`);
        return res.json({ municipios: results });
    });
});

// 📈 Tendencias de Ventas (desde DW)
app.get('/api/reportes/tendencias-ventas', (req, res) => {
    const { fechaInicio, fechaFin, periodo = 'mensual' } = req.query;
    console.log(`📈 [DW] Generando tendencias de ventas (${periodo})`);

    let formatoFecha, grupoPor, ordenCampo, limitResultados;
    switch (periodo) {
        case 'diario':
            formatoFecha = '%Y-%m-%d';
            grupoPor = 'dt.fecha';
            ordenCampo = 'dt.fecha';
            limitResultados = 30; // últimos 30 días
            break;
        case 'semanal':
            formatoFecha = '%Y-%u';
            grupoPor = 'YEARWEEK(dt.fecha)';
            ordenCampo = 'YEARWEEK(dt.fecha)';
            limitResultados = 12; // últimas 12 semanas
            break;
        case 'mensual':
        default:
            formatoFecha = '%Y-%m';
            grupoPor = 'dt.año, dt.mes';
            ordenCampo = 'dt.año, dt.mes';
            limitResultados = 12; // últimos 12 meses
            break;
    }

    let whereClause = '';
    const params = [];
    
    if (fechaInicio && fechaFin) {
        whereClause = 'WHERE dt.fecha BETWEEN ? AND ?';
        params.push(fechaInicio, fechaFin);
    }

    let periodoSelect;
    if (periodo === 'mensual') {
        periodoSelect = "CONCAT(dt.año, '-', LPAD(dt.mes, 2, '0'))";
    } else if (periodo === 'diario') {
        periodoSelect = "DATE_FORMAT(dt.fecha, '%Y-%m-%d')";
    } else {
        periodoSelect = `DATE_FORMAT(MIN(dt.fecha), '${formatoFecha}')`;
    }

    const query = `
        SELECT 
            ${periodo === 'mensual' ? 'dt.año, dt.mes,' : ''}
            ${periodoSelect} as periodo,
            ${periodo === 'mensual' ? 'dt.mes_nombre,' : ''}
            ${periodo === 'diario' ? 'dt.dia_semana_nombre,' : ''}
            COUNT(DISTINCT fv.numero_venta_original) as numero_ventas,
            SUM(fv.total_linea) as total_ventas,
            AVG(fv.total_linea) as promedio_venta,
            MIN(fv.total_linea) as venta_minima,
            MAX(fv.total_linea) as venta_maxima,
            SUM(fv.utilidad_linea) as utilidad_total,
            AVG(fv.margen_linea) as margen_promedio,
            SUM(fv.cantidad_vendida) as productos_vendidos,
            COUNT(DISTINCT fv.cliente_key) as clientes_unicos
        FROM fact_ventas fv
        JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key
        ${whereClause}
        GROUP BY ${grupoPor}${periodo === 'mensual' ? ', dt.mes_nombre' : ''}${periodo === 'diario' ? ', dt.dia_semana_nombre' : ''}
        ORDER BY ${ordenCampo} DESC
        LIMIT ${limitResultados}
    `;

    dwDb.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener tendencias de ventas desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Calcular crecimiento
        const tendenciasConCrecimiento = results.map((item, index) => {
            let crecimiento = 0;
            if (index < results.length - 1) {
                const actual = item.total_ventas;
                const anterior = results[index + 1].total_ventas;
                crecimiento = anterior > 0 ? ((actual - anterior) / anterior * 100).toFixed(2) : 0;
            }
            return { ...item, crecimiento: parseFloat(crecimiento) };
        });

        console.log(`✅ [DW] Generadas tendencias de ${results.length} períodos`);
        return res.json({ tendencias: tendenciasConCrecimiento });
    });
});

// 💰 Análisis de Rentabilidad (desde DW)
app.get('/api/reportes/rentabilidad', (req, res) => {
    const { fechaInicio, fechaFin } = req.query;
    console.log('💰 [DW] Generando análisis de rentabilidad');

    let whereClause = '';
    const params = [];
    
    if (fechaInicio && fechaFin) {
        whereClause = 'AND dt.fecha BETWEEN ? AND ?';
        params.push(fechaInicio, fechaFin);
    }

    const query = `
        SELECT 
            dp.codigo_producto,
            dp.nombre_producto,
            dp.tipo_producto,
            dp.precio_actual as precio_venta,
            dp.costo_actual as costo,
            (dp.precio_actual - dp.costo_actual) as margen_pesos,
            dp.margen_actual as margen_porcentaje_actual,
            SUM(fv.cantidad_vendida) as unidades_vendidas,
            SUM(fv.total_linea) as ingresos_totales,
            SUM(fv.costo_unitario * fv.cantidad_vendida) as costos_totales,
            SUM(fv.utilidad_linea) as ganancia_total,
            AVG(fv.margen_linea) as margen_promedio_real,
            dp.stock_actual,
            (dp.stock_actual * dp.costo_actual) as valor_inventario
        FROM dim_producto dp
        INNER JOIN fact_ventas fv ON dp.producto_key = fv.producto_key
        LEFT JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key
        WHERE dp.costo_actual > 0 ${whereClause}
        GROUP BY dp.producto_key, dp.codigo_producto, dp.nombre_producto, 
                 dp.tipo_producto, dp.precio_actual, dp.costo_actual, 
                 dp.margen_actual, dp.stock_actual
        ORDER BY ganancia_total DESC
    `;

    dwDb.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener análisis de rentabilidad desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ [DW] Generado análisis de rentabilidad de ${results.length} productos`);
        return res.json({ productos: results });
    });
});

// 😴 Clientes Inactivos (desde DW)
app.get('/api/reportes/clientes-inactivos', (req, res) => {
    const diasInactividad = req.query.dias || 30; // Cambiado de 90 a 30 días
    console.log(`😴 [DW] Generando reporte de clientes inactivos (${diasInactividad} días)`);

    const query = `
        SELECT 
            dc.id_cliente_original as id,
            dc.nombre_cliente,
            dc.numero_documento,
            dc.tipo_documento,
            dc.genero_cliente,
            dc.rango_edad,
            dc.municipio,
            dc.fecha_ultima_compra as ultima_compra,
            COALESCE(DATEDIFF(CURDATE(), dc.fecha_ultima_compra), 999) as dias_inactivo,
            dc.total_compras_historico as total_historico,
            dc.numero_compras_historico as numero_compras,
            dc.promedio_compra,
            dc.segmento_cliente,
            dc.fecha_primer_compra,
            dc.email,
            dc.telefono_principal
        FROM dim_cliente dc
        WHERE COALESCE(DATEDIFF(CURDATE(), dc.fecha_ultima_compra), 999) >= ? 
           OR dc.fecha_ultima_compra IS NULL
        ORDER BY dias_inactivo DESC, total_historico DESC
        LIMIT 50
    `;

    dwDb.query(query, [diasInactividad], (err, results) => {
        if (err) {
            console.error('❌ Error al obtener clientes inactivos desde DW:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        console.log(`✅ [DW] Encontrados ${results.length} clientes inactivos`);
        return res.json({ clientes: results });
    });
});

// 💾 Exportar Reportes (mantiene funcionalidad)
app.post('/api/reportes/exportar', (req, res) => {
    const { tipoReporte, datos, formato = 'csv' } = req.body;
    console.log(`💾 Exportando reporte ${tipoReporte} en formato ${formato}`);

    try {
        let contenido = '';
        let mimeType = 'text/csv';
        let extension = 'csv';

        if (formato === 'csv') {
            // Convertir datos a CSV
            if (datos && Object.keys(datos).length > 0) {
                const primeraKey = Object.keys(datos)[0];
                const items = datos[primeraKey] || [];
                
                if (items.length > 0) {
                    // Headers
                    const headers = Object.keys(items[0]).join(',');
                    contenido = headers + '\n';
                    
                    // Datos
                    items.forEach(item => {
                        const fila = Object.values(item).map(value => 
                            typeof value === 'string' ? `"${value}"` : value
                        ).join(',');
                        contenido += fila + '\n';
                    });
                }
            }
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="reporte_${tipoReporte}.${extension}"`);
        res.send(contenido);
        
        console.log('✅ Reporte exportado exitosamente');
    } catch (error) {
        console.error('❌ Error al exportar reporte:', error);
        return res.status(500).json({ error: 'Error al exportar reporte' });
    }
});

// 🔧 Reporte Personalizado desde DW (Query Libre)
app.post('/api/reportes/personalizado', (req, res) => {
    const { query, parametros = [] } = req.body;
    console.log('🔧 [DW] Ejecutando reporte personalizado');

    // Validaciones de seguridad básicas
    const queryLower = query.toLowerCase();
    if (queryLower.includes('drop') || queryLower.includes('delete') || 
        queryLower.includes('update') || queryLower.includes('insert') ||
        queryLower.includes('alter') || queryLower.includes('create')) {
        return res.status(400).json({ error: 'Solo se permiten consultas SELECT' });
    }

    // Ejecutar contra el Data Warehouse
    dwDb.query(query, parametros, (err, results) => {
        if (err) {
            console.error('❌ Error en reporte personalizado DW:', err);
            return res.status(500).json({ error: 'Error en la consulta personalizada' });
        }
        console.log(`✅ [DW] Reporte personalizado ejecutado: ${results.length} registros`);
        return res.json({ datos: results });
    });
});

// Manejador global de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌❌❌ UNCAUGHT EXCEPTION:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌❌❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Manejador de errores de Express
app.use((err, req, res, next) => {
    console.error('❌ Error en Express:', err);
    res.status(500).json({ error: 'Error interno del servidor', details: err.message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    console.log(`✅ Server accessible on http://localhost:${PORT}`);
});

server.on('error', (error) => {
    console.error('❌❌❌ SERVER ERROR:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso`);
    }
});
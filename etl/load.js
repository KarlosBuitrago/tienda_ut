// ===============================================
// 📥 PROCESO DE CARGA (LOAD)
// Carga los datos transformados al Data Warehouse
// ===============================================

const DatabaseConnections = require('./utils/database-connections');
const { createETLLogger } = require('./utils/logger');

class DataLoader {
    constructor() {
        this.db = new DatabaseConnections();
        this.logger = createETLLogger('LOAD');
        this.batchSize = parseInt(process.env.ETL_BATCH_SIZE) || 1000;
    }

    // 🏗️ Inicializar conexión al DW
    async initialize() {
        await this.db.connectDW();
        this.logger.info('Loader inicializado correctamente');
    }

    // 📦 Cargar productos (con manejo de duplicados)
    async loadProducts(products) {
        this.logger.info(`📦 Cargando ${products.length} productos al DW...`);
        
        try {
            let loaded = 0;
            let updated = 0;

            for (const product of products) {
                try {
                    // Verificar si el producto ya existe
                    const [existing] = await this.db.dwConnection.execute(
                        'SELECT producto_key FROM dim_producto WHERE codigo_producto = ?',
                        [product.codigo_producto]
                    );

                    if (existing.length > 0) {
                        // Actualizar producto existente
                        await this.db.dwConnection.execute(`
                            UPDATE dim_producto SET
                                nombre_producto = ?,
                                tipo_producto = ?,
                                unidad_medida = ?,
                                precio_actual = ?,
                                costo_actual = ?,
                                stock_actual = ?,
                                margen_actual = ?,
                                categoria_stock = ?,
                                fecha_actualizacion = CURRENT_TIMESTAMP
                            WHERE codigo_producto = ?
                        `, [
                            product.nombre_producto,
                            product.tipo_producto,
                            product.unidad_medida,
                            product.precio_actual,
                            product.costo_actual,
                            product.stock_actual,
                            product.margen_actual,
                            product.categoria_stock,
                            product.codigo_producto
                        ]);
                        updated++;
                    } else {
                        // Insertar nuevo producto
                        await this.db.dwConnection.execute(`
                            INSERT INTO dim_producto (
                                codigo_producto, nombre_producto, tipo_producto, unidad_medida,
                                precio_actual, costo_actual, stock_actual, margen_actual, categoria_stock
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            product.codigo_producto,
                            product.nombre_producto,
                            product.tipo_producto,
                            product.unidad_medida,
                            product.precio_actual,
                            product.costo_actual,
                            product.stock_actual,
                            product.margen_actual,
                            product.categoria_stock
                        ]);
                        loaded++;
                    }

                    this.logger.incrementLoaded();
                } catch (error) {
                    this.logger.error(`Error cargando producto ${product.codigo_producto}`, error);
                }
            }

            this.logger.info(`✅ Productos: ${loaded} nuevos, ${updated} actualizados`);
            return { loaded, updated };
        } catch (error) {
            this.logger.error('Error en carga masiva de productos', error);
            throw error;
        }
    }

    // 👥 Cargar clientes
    async loadClients(clients) {
        this.logger.info(`👥 Cargando ${clients.length} clientes al DW...`);
        
        try {
            let loaded = 0;
            let updated = 0;

            for (const client of clients) {
                try {
                    const [existing] = await this.db.dwConnection.execute(
                        'SELECT cliente_key FROM dim_cliente WHERE id_cliente_original = ?',
                        [client.id_cliente_original]
                    );

                    if (existing.length > 0) {
                        // Actualizar cliente existente
                        await this.db.dwConnection.execute(`
                            UPDATE dim_cliente SET
                                nombre_cliente = ?,
                                genero_cliente = ?,
                                tipo_documento = ?,
                                numero_documento = ?,
                                municipio = ?,
                                edad = ?,
                                rango_edad = ?,
                                segmento_cliente = ?,
                                email = ?,
                                telefono_principal = ?,
                                direccion = ?,
                                fecha_actualizacion = CURRENT_TIMESTAMP
                            WHERE id_cliente_original = ?
                        `, [
                            client.nombre_cliente,
                            client.genero_cliente,
                            client.tipo_documento,
                            client.numero_documento,
                            client.municipio,
                            client.edad,
                            client.rango_edad,
                            client.segmento_cliente,
                            client.email,
                            client.telefono_principal,
                            client.direccion,
                            client.id_cliente_original
                        ]);
                        updated++;
                    } else {
                        // Insertar nuevo cliente
                        await this.db.dwConnection.execute(`
                            INSERT INTO dim_cliente (
                                id_cliente_original, nombre_cliente, genero_cliente, tipo_documento,
                                numero_documento, municipio, edad, rango_edad, segmento_cliente,
                                email, telefono_principal, direccion
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            client.id_cliente_original,
                            client.nombre_cliente,
                            client.genero_cliente,
                            client.tipo_documento,
                            client.numero_documento,
                            client.municipio,
                            client.edad,
                            client.rango_edad,
                            client.segmento_cliente,
                            client.email,
                            client.telefono_principal,
                            client.direccion
                        ]);
                        loaded++;
                    }

                    this.logger.incrementLoaded();
                } catch (error) {
                    this.logger.error(`Error cargando cliente ${client.id_cliente_original}`, error);
                }
            }

            this.logger.info(`✅ Clientes: ${loaded} nuevos, ${updated} actualizados`);
            return { loaded, updated };
        } catch (error) {
            this.logger.error('Error en carga masiva de clientes', error);
            throw error;
        }
    }

    // 🌍 Cargar ubicaciones
    async loadLocations(locations) {
        this.logger.info(`🌍 Cargando ${locations.length} ubicaciones al DW...`);
        
        try {
            let loaded = 0;
            let updated = 0;

            for (const location of locations) {
                try {
                    const [existing] = await this.db.dwConnection.execute(
                        'SELECT ubicacion_key FROM dim_ubicacion WHERE id_municipio_original = ?',
                        [location.id_municipio_original]
                    );

                    if (existing.length > 0) {
                        await this.db.dwConnection.execute(`
                            UPDATE dim_ubicacion SET
                                nombre_municipio = ?,
                                departamento = ?,
                                region = ?,
                                zona = ?
                            WHERE id_municipio_original = ?
                        `, [
                            location.nombre_municipio,
                            location.departamento,
                            location.region,
                            location.zona,
                            location.id_municipio_original
                        ]);
                        updated++;
                    } else {
                        await this.db.dwConnection.execute(`
                            INSERT INTO dim_ubicacion (
                                id_municipio_original, nombre_municipio, departamento, region, zona
                            ) VALUES (?, ?, ?, ?, ?)
                        `, [
                            location.id_municipio_original,
                            location.nombre_municipio,
                            location.departamento,
                            location.region,
                            location.zona
                        ]);
                        loaded++;
                    }

                    this.logger.incrementLoaded();
                } catch (error) {
                    this.logger.error(`Error cargando ubicación ${location.id_municipio_original}`, error);
                }
            }

            this.logger.info(`✅ Ubicaciones: ${loaded} nuevas, ${updated} actualizadas`);
            return { loaded, updated };
        } catch (error) {
            this.logger.error('Error en carga masiva de ubicaciones', error);
            throw error;
        }
    }

    // 💳 Cargar medios de pago
    async loadPaymentMethods(paymentMethods) {
        this.logger.info(`💳 Cargando ${paymentMethods.length} medios de pago al DW...`);
        
        try {
            let loaded = 0;
            let updated = 0;

            for (const pm of paymentMethods) {
                try {
                    const [existing] = await this.db.dwConnection.execute(
                        'SELECT medio_pago_key FROM dim_medio_pago WHERE id_medio_pago_original = ?',
                        [pm.id_medio_pago_original]
                    );

                    if (existing.length > 0) {
                        await this.db.dwConnection.execute(`
                            UPDATE dim_medio_pago SET
                                nombre_medio_pago = ?,
                                tipo_pago = ?
                            WHERE id_medio_pago_original = ?
                        `, [pm.nombre_medio_pago, pm.tipo_pago, pm.id_medio_pago_original]);
                        updated++;
                    } else {
                        await this.db.dwConnection.execute(`
                            INSERT INTO dim_medio_pago (
                                id_medio_pago_original, nombre_medio_pago, tipo_pago
                            ) VALUES (?, ?, ?)
                        `, [pm.id_medio_pago_original, pm.nombre_medio_pago, pm.tipo_pago]);
                        loaded++;
                    }

                    this.logger.incrementLoaded();
                } catch (error) {
                    this.logger.error(`Error cargando medio de pago ${pm.id_medio_pago_original}`, error);
                }
            }

            this.logger.info(`✅ Medios de pago: ${loaded} nuevos, ${updated} actualizados`);
            return { loaded, updated };
        } catch (error) {
            this.logger.error('Error en carga masiva de medios de pago', error);
            throw error;
        }
    }

    // 💰 Cargar hechos de ventas (con resolución de claves)
    async loadSales(sales) {
        this.logger.info(`💰 Cargando ${sales.length} hechos de ventas al DW...`);
        
        try {
            let loaded = 0;
            let skipped = 0;

            // Crear mapas de claves para optimizar búsquedas
            const dimensionKeys = await this.getDimensionKeyMaps();

            for (const sale of sales) {
                try {
                    // Resolver claves de dimensiones
                    const keys = await this.resolveDimensionKeys(sale, dimensionKeys);
                    
                    if (!keys.tiempo_key || !keys.producto_key || !keys.cliente_key || !keys.ubicacion_key) {
                        this.logger.warn(`Venta ${sale.numero_venta_original} omitida por claves faltantes`);
                        skipped++;
                        continue;
                    }

                    // Verificar si la venta ya existe (evitar duplicados)
                    const [existing] = await this.db.dwConnection.execute(`
                        SELECT venta_key FROM fact_ventas 
                        WHERE numero_venta_original = ? 
                        AND codigo_producto_original = ?
                    `, [sale.numero_venta_original, sale.codigo_producto_original]);

                    if (existing.length === 0) {
                        await this.db.dwConnection.execute(`
                            INSERT INTO fact_ventas (
                                tiempo_key, producto_key, cliente_key, ubicacion_key, medio_pago_key,
                                numero_venta_original, codigo_producto_original, id_cliente_original,
                                cantidad_vendida, precio_unitario, costo_unitario, subtotal,
                                descuento, total_linea, utilidad_linea, margen_linea,
                                tipo_venta, fecha_venta_original
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            keys.tiempo_key,
                            keys.producto_key,
                            keys.cliente_key,
                            keys.ubicacion_key,
                            keys.medio_pago_key,
                            sale.numero_venta_original,
                            sale.codigo_producto_original,
                            sale.id_cliente_original,
                            sale.cantidad_vendida,
                            sale.precio_unitario,
                            sale.costo_unitario,
                            sale.subtotal,
                            sale.descuento,
                            sale.total_linea,
                            sale.utilidad_linea,
                            sale.margen_linea,
                            sale.tipo_venta,
                            sale.fecha_venta_original
                        ]);
                        
                        loaded++;
                        this.logger.incrementLoaded();
                    } else {
                        skipped++;
                    }

                    // Log progreso cada 100 registros
                    if ((loaded + skipped) % 100 === 0) {
                        this.logger.logProgress(loaded + skipped, sales.length, 'cargando ventas');
                    }
                } catch (error) {
                    this.logger.error(`Error cargando venta ${sale.numero_venta_original}`, error);
                    skipped++;
                }
            }

            this.logger.info(`✅ Ventas: ${loaded} cargadas, ${skipped} omitidas`);
            return { loaded, skipped };
        } catch (error) {
            this.logger.error('Error en carga masiva de ventas', error);
            throw error;
        }
    }

    // 🗝️ Crear mapas de claves para optimizar búsquedas
    async getDimensionKeyMaps() {
        const maps = {};

        try {
            // Mapa de tiempo
            const [timeRows] = await this.db.dwConnection.execute(
                'SELECT tiempo_key, fecha FROM dim_tiempo'
            );
            maps.tiempo = new Map();
            timeRows.forEach(row => {
                const dateStr = row.fecha.toISOString().split('T')[0];
                maps.tiempo.set(dateStr, row.tiempo_key);
            });

            // Mapa de productos
            const [productRows] = await this.db.dwConnection.execute(
                'SELECT producto_key, codigo_producto FROM dim_producto'
            );
            maps.producto = new Map();
            productRows.forEach(row => {
                maps.producto.set(row.codigo_producto, row.producto_key);
            });

            // Mapa de clientes
            const [clientRows] = await this.db.dwConnection.execute(
                'SELECT cliente_key, id_cliente_original FROM dim_cliente'
            );
            maps.cliente = new Map();
            clientRows.forEach(row => {
                maps.cliente.set(row.id_cliente_original, row.cliente_key);
            });

            // Mapa de ubicaciones
            const [locationRows] = await this.db.dwConnection.execute(
                'SELECT ubicacion_key, id_municipio_original FROM dim_ubicacion'
            );
            maps.ubicacion = new Map();
            locationRows.forEach(row => {
                maps.ubicacion.set(row.id_municipio_original, row.ubicacion_key);
            });

            // Mapa de medios de pago
            const [paymentRows] = await this.db.dwConnection.execute(
                'SELECT medio_pago_key, id_medio_pago_original FROM dim_medio_pago'
            );
            maps.medio_pago = new Map();
            paymentRows.forEach(row => {
                maps.medio_pago.set(row.id_medio_pago_original, row.medio_pago_key);
            });

            this.logger.info('🗝️ Mapas de claves de dimensiones creados');
            return maps;
        } catch (error) {
            this.logger.error('Error creando mapas de claves', error);
            throw error;
        }
    }

    // 🔍 Resolver claves de dimensiones para un registro de venta
    async resolveDimensionKeys(sale, maps) {
        const keys = {};

        try {
            // Resolver tiempo_key
            const fechaVenta = new Date(sale.fecha_venta_original).toISOString().split('T')[0];
            keys.tiempo_key = maps.tiempo.get(fechaVenta) || null;

            // Resolver producto_key
            keys.producto_key = maps.producto.get(sale.codigo_producto_original) || null;

            // Resolver cliente_key
            keys.cliente_key = maps.cliente.get(sale.id_cliente_original) || null;

            // Resolver ubicacion_key
            keys.ubicacion_key = maps.ubicacion.get(sale.id_municipio_original) || null;

            // Resolver medio_pago_key (opcional)
            keys.medio_pago_key = sale.id_medio_pago_original 
                ? maps.medio_pago.get(sale.id_medio_pago_original) || null 
                : null;

            return keys;
        } catch (error) {
            this.logger.error('Error resolviendo claves de dimensiones', error);
            return {};
        }
    }

    // 📊 Actualizar estadísticas de clientes
    async updateClientStatistics() {
        this.logger.info('📊 Actualizando estadísticas de clientes...');
        
        try {
            await this.db.dwConnection.execute(`
                UPDATE dim_cliente dc
                INNER JOIN (
                    SELECT 
                        id_cliente_original,
                        MIN(DATE(fecha_venta_original)) as fecha_primer_compra,
                        MAX(DATE(fecha_venta_original)) as fecha_ultima_compra,
                        SUM(total_linea) as total_compras,
                        COUNT(DISTINCT numero_venta_original) as numero_compras
                    FROM fact_ventas
                    GROUP BY id_cliente_original
                ) stats ON dc.id_cliente_original = stats.id_cliente_original
                SET 
                    dc.fecha_primer_compra = stats.fecha_primer_compra,
                    dc.fecha_ultima_compra = stats.fecha_ultima_compra,
                    dc.total_compras_historico = stats.total_compras,
                    dc.numero_compras_historico = stats.numero_compras,
                    dc.promedio_compra = stats.total_compras / stats.numero_compras
            `);

            this.logger.info('✅ Estadísticas de clientes actualizadas');
        } catch (error) {
            this.logger.error('Error actualizando estadísticas de clientes', error);
        }
    }

    // 🚪 Finalizar y cerrar conexiones
    async finalize() {
        await this.db.closeAll();
        this.logger.info('Loader finalizado correctamente');
    }
}

module.exports = DataLoader;
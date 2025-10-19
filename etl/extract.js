// ===============================================
// 📤 PROCESO DE EXTRACCIÓN (EXTRACT)
// Extrae datos de la base operacional (OLTP)
// ===============================================

const DatabaseConnections = require('./utils/database-connections');
const { createETLLogger } = require('./utils/logger');

class DataExtractor {
    constructor() {
        this.db = new DatabaseConnections();
        this.logger = createETLLogger('EXTRACT');
    }

    // 🏗️ Inicializar conexión
    async initialize() {
        await this.db.connectOLTP();
        this.logger.info('Extractor inicializado correctamente');
    }

    // 🛍️ Extraer datos de productos
    async extractProducts() {
        this.logger.info('📦 Extrayendo datos de productos...');
        
        try {
            const [products] = await this.db.oltpConnection.execute(`
                SELECT 
                    p.codigo_producto,
                    p.nombre_producto,
                    p.precio_venta,
                    p.costo,
                    p.stock,
                    tp.nombre_tipo_producto,
                    um.nombre_unidad_medida
                FROM producto p
                INNER JOIN tipo_producto tp ON p.id_tipo_producto = tp.id
                INNER JOIN unidad_medida um ON p.id_unidad_medida = um.id
                ORDER BY p.codigo_producto
            `);

            this.logger.incrementExtracted(products.length);
            this.logger.info(`✅ ${products.length} productos extraídos`);
            
            return products;
        } catch (error) {
            this.logger.error('Error extrayendo productos', error);
            throw error;
        }
    }

    // 👥 Extraer datos de clientes
    async extractClients() {
        this.logger.info('👥 Extrayendo datos de clientes...');
        
        try {
            const [clients] = await this.db.oltpConnection.execute(`
                SELECT 
                    c.id as id_cliente,
                    c.nombre_cliente,
                    c.direccion_cliente,
                    c.genero_cliente,
                    c.numero_documento,
                    c.fecha_nacimiento,
                    c.email,
                    td.nombre_tipo_documento,
                    m.nombre_municipio,
                    -- Calcular edad si hay fecha de nacimiento
                    CASE 
                        WHEN c.fecha_nacimiento IS NOT NULL AND c.fecha_nacimiento != '' 
                        THEN TIMESTAMPDIFF(YEAR, STR_TO_DATE(c.fecha_nacimiento, '%Y-%m-%d'), CURDATE())
                        ELSE NULL
                    END as edad,
                    -- Teléfono principal (primer teléfono encontrado)
                    (SELECT t.numero_telefono 
                     FROM telefono t 
                     WHERE t.id_cliente = c.id 
                     LIMIT 1) as telefono_principal
                FROM cliente c
                INNER JOIN tipo_documento td ON c.id_tipo_documento = td.id
                INNER JOIN municipio m ON c.id_municipio = m.id
                ORDER BY c.id
            `);

            this.logger.incrementExtracted(clients.length);
            this.logger.info(`✅ ${clients.length} clientes extraídos`);
            
            return clients;
        } catch (error) {
            this.logger.error('Error extrayendo clientes', error);
            throw error;
        }
    }

    // 🌍 Extraer datos de ubicaciones
    async extractLocations() {
        this.logger.info('🌍 Extrayendo datos de ubicaciones...');
        
        try {
            const [locations] = await this.db.oltpConnection.execute(`
                SELECT 
                    id as id_municipio,
                    nombre_municipio,
                    -- Por ahora asignamos departamentos genéricos
                    -- En el futuro se puede expandir con una tabla de departamentos
                    CASE 
                        WHEN nombre_municipio LIKE '%Bogotá%' THEN 'Bogotá D.C.'
                        WHEN nombre_municipio LIKE '%Medellín%' THEN 'Antioquia'
                        WHEN nombre_municipio LIKE '%Cali%' THEN 'Valle del Cauca'
                        WHEN nombre_municipio LIKE '%Barranquilla%' THEN 'Atlántico'
                        ELSE 'Otros Departamentos'
                    END as departamento,
                    CASE 
                        WHEN nombre_municipio LIKE '%Bogotá%' THEN 'Región Central'
                        WHEN nombre_municipio LIKE '%Medellín%' THEN 'Región Antioquia'
                        WHEN nombre_municipio LIKE '%Cali%' THEN 'Región Pacífico'
                        WHEN nombre_municipio LIKE '%Barranquilla%' THEN 'Región Caribe'
                        ELSE 'Otras Regiones'
                    END as region
                FROM municipio
                ORDER BY id
            `);

            this.logger.incrementExtracted(locations.length);
            this.logger.info(`✅ ${locations.length} ubicaciones extraídas`);
            
            return locations;
        } catch (error) {
            this.logger.error('Error extrayendo ubicaciones', error);
            throw error;
        }
    }

    // 💳 Extraer datos de medios de pago
    async extractPaymentMethods() {
        this.logger.info('💳 Extrayendo medios de pago...');
        
        try {
            const [paymentMethods] = await this.db.oltpConnection.execute(`
                SELECT 
                    id as id_medio_pago,
                    nombre_medio_pago,
                    CASE 
                        WHEN LOWER(nombre_medio_pago) LIKE '%efectivo%' THEN 'Efectivo'
                        WHEN LOWER(nombre_medio_pago) LIKE '%tarjeta%' 
                          OR LOWER(nombre_medio_pago) LIKE '%debito%' 
                          OR LOWER(nombre_medio_pago) LIKE '%credito%' THEN 'Tarjeta'
                        WHEN LOWER(nombre_medio_pago) LIKE '%transferencia%' THEN 'Transferencia'
                        WHEN LOWER(nombre_medio_pago) LIKE '%pse%' THEN 'Transferencia'
                        ELSE 'Otro'
                    END as tipo_pago
                FROM medio_pago
                ORDER BY id
            `);

            this.logger.incrementExtracted(paymentMethods.length);
            this.logger.info(`✅ ${paymentMethods.length} medios de pago extraídos`);
            
            return paymentMethods;
        } catch (error) {
            this.logger.error('Error extrayendo medios de pago', error);
            throw error;
        }
    }

    // 💰 Extraer datos de ventas (con paginación)
    async extractSales(batchSize = 1000, offset = 0) {
        this.logger.info(`💰 Extrayendo ventas (lote: ${offset}-${offset + batchSize})...`);
        
        try {
            const [sales] = await this.db.oltpConnection.query(`
                SELECT 
                    v.numero_venta,
                    v.fecha_venta,
                    v.tipo_venta,
                    v.id_cliente,
                    v.total_venta,
                    dv.codigo_producto,
                    dv.item as cantidad_vendida,
                    dv.precio_unitario,
                    dv.subtotal,
                    -- Obtener costo del producto
                    p.costo as costo_unitario,
                    -- Calcular descuento (si subtotal < precio_unitario * cantidad)
                    CASE 
                        WHEN dv.subtotal < (dv.precio_unitario * dv.item) 
                        THEN (dv.precio_unitario * dv.item) - dv.subtotal
                        ELSE 0 
                    END as descuento,
                    -- Obtener información del cliente
                    c.id_municipio,
                    -- Obtener medio de pago (primer pago asociado a la venta)
                    (SELECT p_mp.id_medio_pago 
                     FROM pago p_mp 
                     WHERE p_mp.numero_venta = v.numero_venta 
                     LIMIT 1) as id_medio_pago
                FROM venta v
                INNER JOIN detalle_venta dv ON v.numero_venta = dv.numero_venta
                INNER JOIN producto p ON dv.codigo_producto = p.codigo_producto
                INNER JOIN cliente c ON v.id_cliente = c.id
                ORDER BY v.fecha_venta DESC, v.numero_venta, dv.codigo_producto
                LIMIT ${batchSize} OFFSET ${offset}
            `);

            this.logger.incrementExtracted(sales.length);
            this.logger.info(`✅ ${sales.length} registros de ventas extraídos`);
            
            return sales;
        } catch (error) {
            this.logger.error('Error extrayendo ventas', error);
            throw error;
        }
    }

    // 📊 Contar total de ventas (para paginación)
    async getTotalSalesCount() {
        try {
            const [result] = await this.db.oltpConnection.execute(`
                SELECT COUNT(*) as total
                FROM venta v
                INNER JOIN detalle_venta dv ON v.numero_venta = dv.numero_venta
            `);
            
            return result[0].total;
        } catch (error) {
            this.logger.error('Error contando ventas totales', error);
            throw error;
        }
    }

    // 🔍 Extraer datos específicos por fecha
    async extractSalesByDateRange(startDate, endDate) {
        this.logger.info(`📅 Extrayendo ventas del ${startDate} al ${endDate}...`);
        
        try {
            const [sales] = await this.db.oltpConnection.execute(`
                SELECT 
                    v.numero_venta,
                    v.fecha_venta,
                    v.tipo_venta,
                    v.id_cliente,
                    v.total_venta,
                    dv.codigo_producto,
                    dv.item as cantidad_vendida,
                    dv.precio_unitario,
                    dv.subtotal,
                    p.costo as costo_unitario,
                    CASE 
                        WHEN dv.subtotal < (dv.precio_unitario * dv.item) 
                        THEN (dv.precio_unitario * dv.item) - dv.subtotal
                        ELSE 0 
                    END as descuento,
                    c.id_municipio,
                    (SELECT p_mp.id_medio_pago 
                     FROM pago p_mp 
                     WHERE p_mp.numero_venta = v.numero_venta 
                     LIMIT 1) as id_medio_pago
                FROM venta v
                INNER JOIN detalle_venta dv ON v.numero_venta = dv.numero_venta
                INNER JOIN producto p ON dv.codigo_producto = p.codigo_producto
                INNER JOIN cliente c ON v.id_cliente = c.id
                WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
                ORDER BY v.fecha_venta DESC, v.numero_venta, dv.codigo_producto
            `, [startDate, endDate]);

            this.logger.incrementExtracted(sales.length);
            this.logger.info(`✅ ${sales.length} ventas extraídas para el período ${startDate} - ${endDate}`);
            
            return sales;
        } catch (error) {
            this.logger.error(`Error extrayendo ventas por rango de fechas`, error);
            throw error;
        }
    }

    // 🚪 Finalizar y cerrar conexiones
    async finalize() {
        await this.db.closeAll();
        this.logger.info('Extractor finalizado correctamente');
    }
}

module.exports = DataExtractor;
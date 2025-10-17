// ===============================================
// 📊 ETL ESPECÍFICO PARA TABLAS DE HECHOS
// Completa la carga de fact_ventas y fact_ventas_diario
// ===============================================

const dotenv = require('dotenv');
dotenv.config();

const mysql = require('mysql2');
const winston = require('winston');

// Configurar logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: './logs/etl-hechos.log' })
    ]
});

// Conexiones a bases de datos
const oltpConnection = mysql.createConnection({
    host: process.env.OLTP_HOST,
    user: process.env.OLTP_USER,
    password: process.env.OLTP_PASSWORD,
    database: process.env.OLTP_DATABASE
});

const dwConnection = mysql.createConnection({
    host: process.env.DW_HOST,
    user: process.env.DW_USER,
    password: process.env.DW_PASSWORD,
    database: process.env.DW_DATABASE
});

async function cargarHechosVentas() {
    return new Promise((resolve, reject) => {
        logger.info('🚀 Iniciando carga de FACT_VENTAS...');
        
        // Consulta completa para extraer ventas con todas las dimensiones
        const extractQuery = `
            SELECT 
                v.numero_venta,
                v.fecha_venta,
                v.tipo_venta,
                v.id_cliente,
                v.total_venta,
                dv.codigo_producto,
                dv.item,
                dv.precio_unitario,
                dv.subtotal,
                p.costo,
                c.id_municipio,
                -- Buscar medio de pago (si existe)
                COALESCE(pg.id_medio_pago, 1) as id_medio_pago
            FROM venta v
            INNER JOIN detalle_venta dv ON v.numero_venta = dv.numero_venta
            INNER JOIN producto p ON dv.codigo_producto = p.codigo_producto
            INNER JOIN cliente c ON v.id_cliente = c.id
            LEFT JOIN pago pg ON v.numero_venta = pg.numero_venta
            ORDER BY v.fecha_venta, v.numero_venta
        `;
        
        oltpConnection.query(extractQuery, (err, ventas) => {
            if (err) {
                logger.error('❌ Error extrayendo ventas: ' + err.message);
                return reject(err);
            }
            
            logger.info(`📦 Extraídas ${ventas.length} líneas de venta`);
            
            if (ventas.length === 0) {
                logger.warn('⚠️ No hay ventas para procesar');
                return resolve();
            }
            
            // Procesar cada venta y cargar a fact_ventas
            let processedCount = 0;
            let errorCount = 0;
            
            ventas.forEach((venta, index) => {
                // Buscar claves de dimensiones
                const insertQuery = `
                    INSERT INTO fact_ventas (
                        tiempo_key, producto_key, cliente_key, ubicacion_key, medio_pago_key,
                        numero_venta_original, codigo_producto_original, id_cliente_original,
                        cantidad_vendida, precio_unitario, costo_unitario, subtotal, descuento,
                        total_linea, utilidad_linea, margen_linea, tipo_venta, fecha_venta_original
                    )
                    SELECT 
                        dt.tiempo_key,
                        dp.producto_key,
                        dc.cliente_key,
                        du.ubicacion_key,
                        COALESCE(dmp.medio_pago_key, 1) as medio_pago_key,
                        ? as numero_venta_original,
                        ? as codigo_producto_original,
                        ? as id_cliente_original,
                        1 as cantidad_vendida,
                        ? as precio_unitario,
                        ? as costo_unitario,
                        ? as subtotal,
                        0 as descuento,
                        ? as total_linea,
                        (? - ?) as utilidad_linea,
                        CASE WHEN ? > 0 THEN ((? - ?) / ?) * 100 ELSE 0 END as margen_linea,
                        ? as tipo_venta,
                        ? as fecha_venta_original
                    FROM dim_tiempo dt
                    CROSS JOIN dim_producto dp
                    CROSS JOIN dim_cliente dc
                    CROSS JOIN dim_ubicacion du
                    LEFT JOIN dim_medio_pago dmp ON dmp.id_medio_pago_original = ?
                    WHERE DATE(dt.fecha) = DATE(?)
                        AND dp.codigo_producto = ?
                        AND dc.id_cliente_original = ?
                        AND du.id_municipio_original = ?
                    LIMIT 1
                `;
                
                const params = [
                    venta.numero_venta, venta.codigo_producto, venta.id_cliente,
                    venta.precio_unitario, venta.costo, venta.subtotal, venta.subtotal,
                    venta.subtotal, venta.costo, venta.subtotal, venta.subtotal, venta.costo, venta.subtotal,
                    venta.tipo_venta, venta.fecha_venta,
                    venta.id_medio_pago, venta.fecha_venta, venta.codigo_producto, venta.id_cliente, venta.id_municipio
                ];
                
                dwConnection.query(insertQuery, params, (err, result) => {
                    if (err) {
                        logger.error(`❌ Error insertando venta ${venta.numero_venta}: ${err.message}`);
                        errorCount++;
                    } else {
                        processedCount++;
                    }
                    
                    // Verificar si terminamos
                    if (processedCount + errorCount === ventas.length) {
                        logger.info(`✅ Procesadas ${processedCount} ventas, ${errorCount} errores`);
                        resolve();
                    }
                });
            });
        });
    });
}

async function cargarHechosDiarios() {
    return new Promise((resolve, reject) => {
        logger.info('📅 Iniciando carga de FACT_VENTAS_DIARIO...');
        
        const aggregateQuery = `
            INSERT INTO fact_ventas_diario (
                tiempo_key, ubicacion_key, total_ventas, total_cantidad_productos,
                total_utilidad, numero_transacciones, numero_clientes_unicos, ticket_promedio
            )
            SELECT 
                fv.tiempo_key,
                fv.ubicacion_key,
                SUM(fv.total_linea) as total_ventas,
                SUM(fv.cantidad_vendida) as total_cantidad_productos,
                SUM(fv.utilidad_linea) as total_utilidad,
                COUNT(DISTINCT fv.numero_venta_original) as numero_transacciones,
                COUNT(DISTINCT fv.id_cliente_original) as numero_clientes_unicos,
                AVG(fv.total_linea) as ticket_promedio
            FROM fact_ventas fv
            GROUP BY fv.tiempo_key, fv.ubicacion_key
            ON DUPLICATE KEY UPDATE
                total_ventas = VALUES(total_ventas),
                total_cantidad_productos = VALUES(total_cantidad_productos),
                total_utilidad = VALUES(total_utilidad),
                numero_transacciones = VALUES(numero_transacciones),
                numero_clientes_unicos = VALUES(numero_clientes_unicos),
                ticket_promedio = VALUES(ticket_promedio),
                fecha_actualizacion = CURRENT_TIMESTAMP
        `;
        
        dwConnection.query(aggregateQuery, (err, result) => {
            if (err) {
                logger.error('❌ Error agregando hechos diarios: ' + err.message);
                return reject(err);
            }
            
            logger.info(`✅ Creados ${result.affectedRows} registros diarios`);
            resolve();
        });
    });
}

async function ejecutarETLHechos() {
    try {
        logger.info('🎯 INICIANDO ETL DE TABLAS DE HECHOS');
        
        // 1. Cargar fact_ventas
        await cargarHechosVentas();
        
        // 2. Cargar fact_ventas_diario
        await cargarHechosDiarios();
        
        logger.info('🎉 ETL DE HECHOS COMPLETADO EXITOSAMENTE');
        
    } catch (error) {
        logger.error('💥 Error en ETL de hechos: ' + error.message);
    } finally {
        oltpConnection.end();
        dwConnection.end();
    }
}

// Ejecutar el proceso
ejecutarETLHechos();
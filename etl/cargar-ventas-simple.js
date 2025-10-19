// ===============================================
// 🚀 Script Simple para Cargar Ventas al DW
// Carga directa sin procesar por lotes grandes
// ===============================================

require('dotenv').config();
const mysql = require('mysql2/promise');

async function cargarVentas() {
    let oltpConn, dwConn;

    try {
        console.log('🔌 Conectando a bases de datos...');

        // Conexión OLTP
        oltpConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'tienda_cipa'
        });

        // Conexión DW
        dwConn = await mysql.createConnection({
            host: process.env.DW_HOST || 'localhost',
            user: process.env.DW_USER || 'root',
            password: process.env.DW_PASSWORD,
            database: process.env.DW_NAME || 'tienda_cipa_dw'
        });

        console.log('✅ Conectado a ambas bases de datos');

        // 1. Contar registros actuales
        console.log('\n📊 Estado actual:');
        const [oltpCount] = await oltpConn.execute('SELECT COUNT(*) as total FROM detalle_venta');
        const [dwCount] = await dwConn.execute('SELECT COUNT(*) as total FROM fact_ventas');
        console.log(`   OLTP (detalle_venta): ${oltpCount[0].total} registros`);
        console.log(`   DW (fact_ventas): ${dwCount[0].total} registros`);
        console.log(`   Faltantes: ${oltpCount[0].total - dwCount[0].total} registros\n`);

        // 2. Crear mapas de claves de dimensiones
        console.log('🗝️ Cargando mapas de claves de dimensiones...');
        
        const [tiempoRows] = await dwConn.execute('SELECT tiempo_key, fecha FROM dim_tiempo');
        const mapTiempo = new Map();
        tiempoRows.forEach(row => {
            const dateStr = row.fecha.toISOString().split('T')[0];
            mapTiempo.set(dateStr, row.tiempo_key);
        });
        console.log(`   ✓ dim_tiempo: ${mapTiempo.size} fechas`);

        const [productoRows] = await dwConn.execute('SELECT producto_key, codigo_producto FROM dim_producto');
        const mapProducto = new Map();
        productoRows.forEach(row => {
            mapProducto.set(row.codigo_producto, row.producto_key);
        });
        console.log(`   ✓ dim_producto: ${mapProducto.size} productos`);

        const [clienteRows] = await dwConn.execute('SELECT cliente_key, id_cliente_original FROM dim_cliente');
        const mapCliente = new Map();
        clienteRows.forEach(row => {
            mapCliente.set(row.id_cliente_original, row.cliente_key);
        });
        console.log(`   ✓ dim_cliente: ${mapCliente.size} clientes`);

        const [ubicacionRows] = await dwConn.execute('SELECT ubicacion_key, id_municipio_original FROM dim_ubicacion');
        const mapUbicacion = new Map();
        ubicacionRows.forEach(row => {
            mapUbicacion.set(row.id_municipio_original, row.ubicacion_key);
        });
        console.log(`   ✓ dim_ubicacion: ${mapUbicacion.size} ubicaciones`);

        const [pagoRows] = await dwConn.execute('SELECT medio_pago_key, id_medio_pago_original FROM dim_medio_pago');
        const mapPago = new Map();
        pagoRows.forEach(row => {
            mapPago.set(row.id_medio_pago_original, row.medio_pago_key);
        });
        console.log(`   ✓ dim_medio_pago: ${mapPago.size} medios de pago\n`);

        // 3. Extraer ventas de OLTP
        console.log('📥 Extrayendo ventas de OLTP...');
        const [ventas] = await oltpConn.execute(`
            SELECT 
                dv.numero_venta,
                dv.codigo_producto,
                v.id_cliente,
                c.id_municipio,
                DATE(v.fecha_venta) as fecha_venta,
                1 as cantidad,
                dv.precio_unitario,
                p.costo,
                dv.subtotal,
                0 as descuento,
                dv.subtotal as total,
                (dv.precio_unitario - p.costo) as utilidad,
                CASE 
                    WHEN dv.precio_unitario > 0 
                    THEN ((dv.precio_unitario - p.costo) / dv.precio_unitario) * 100 
                    ELSE 0 
                END as margen,
                v.tipo_venta,
                v.fecha_venta as fecha_hora_venta
            FROM detalle_venta dv
            JOIN venta v ON dv.numero_venta = v.numero_venta
            JOIN cliente c ON v.id_cliente = c.id
            JOIN producto p ON dv.codigo_producto = p.codigo_producto
            ORDER BY v.fecha_venta
        `);

        console.log(`✅ Extraídas ${ventas.length} líneas de venta\n`);

        // 4. Cargar ventas al DW
        console.log('💰 Cargando ventas al DW...');
        let cargadas = 0;
        let omitidas = 0;
        let errores = 0;

        for (let i = 0; i < ventas.length; i++) {
            const venta = ventas[i];

            try {
                // Resolver claves
                const fechaStr = venta.fecha_venta.toISOString().split('T')[0];
                const tiempoKey = mapTiempo.get(fechaStr);
                const productoKey = mapProducto.get(venta.codigo_producto);
                const clienteKey = mapCliente.get(venta.id_cliente);
                const ubicacionKey = mapUbicacion.get(venta.id_municipio);
                const pagoKey = null; // No tenemos medio de pago en esta tabla

                // Validar claves requeridas
                if (!tiempoKey || !productoKey || !clienteKey || !ubicacionKey) {
                    console.log(`⚠️ Venta ${venta.numero_venta} omitida - tiempo:${tiempoKey ? 'OK' : 'FALTA'} producto:${productoKey ? 'OK' : 'FALTA'} cliente:${clienteKey ? 'OK' : 'FALTA'} ubicacion:${ubicacionKey ? 'OK' : 'FALTA'} fecha:${fechaStr}`);
                    omitidas++;
                    continue;
                }

                // Verificar si ya existe
                const [existe] = await dwConn.execute(
                    'SELECT venta_key FROM fact_ventas WHERE numero_venta_original = ? AND codigo_producto_original = ?',
                    [venta.numero_venta, venta.codigo_producto]
                );

                if (existe.length > 0) {
                    omitidas++;
                    continue;
                }

                // Insertar venta
                await dwConn.execute(`
                    INSERT INTO fact_ventas (
                        tiempo_key, producto_key, cliente_key, ubicacion_key, medio_pago_key,
                        numero_venta_original, codigo_producto_original, id_cliente_original,
                        cantidad_vendida, precio_unitario, costo_unitario, subtotal,
                        descuento, total_linea, utilidad_linea, margen_linea,
                        tipo_venta, fecha_venta_original
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    tiempoKey,
                    productoKey,
                    clienteKey,
                    ubicacionKey,
                    pagoKey,
                    venta.numero_venta,
                    venta.codigo_producto,
                    venta.id_cliente,
                    venta.cantidad,
                    venta.precio_unitario,
                    venta.costo,
                    venta.subtotal,
                    venta.descuento,
                    venta.total,
                    venta.utilidad,
                    venta.margen,
                    venta.tipo_venta,
                    venta.fecha_hora_venta
                ]);

                cargadas++;

                // Progreso cada 10 registros
                if ((i + 1) % 10 === 0) {
                    console.log(`   Procesadas ${i + 1}/${ventas.length} (${cargadas} cargadas, ${omitidas} omitidas)`);
                }

            } catch (error) {
                console.error(`❌ Error procesando venta ${venta.numero_venta}:`, error.message);
                errores++;
            }
        }

        console.log('\n✅ Carga completada:');
        console.log(`   Cargadas: ${cargadas}`);
        console.log(`   Omitidas: ${omitidas}`);
        console.log(`   Errores: ${errores}`);

        // 5. Actualizar estadísticas de clientes
        console.log('\n📊 Actualizando estadísticas de clientes...');
        await dwConn.execute(`
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
        console.log('✅ Estadísticas actualizadas');

        // 6. Estado final
        const [dwFinalCount] = await dwConn.execute('SELECT COUNT(*) as total FROM fact_ventas');
        console.log(`\n🎉 Total final en DW: ${dwFinalCount[0].total} registros`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (oltpConn) await oltpConn.end();
        if (dwConn) await dwConn.end();
        console.log('\n🚪 Conexiones cerradas');
    }
}

// Ejecutar
cargarVentas();

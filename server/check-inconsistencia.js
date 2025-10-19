require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarInconsistencia() {
    console.log('🔍 VERIFICANDO INCONSISTENCIA EN VENTAS\n');
    console.log('=' .repeat(60));

    // Conexión OLTP
    const oltpDb = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // Conexión DW
    const dwDb = await mysql.createConnection({
        host: process.env.DW_HOST,
        user: process.env.DW_USER,
        password: process.env.DW_PASSWORD,
        database: process.env.DW_NAME
    });

    try {
        // 1. Verificar registros en OLTP
        console.log('\n📊 BASE DE DATOS OLTP (tienda_cipa):');
        console.log('-'.repeat(60));
        
        const [ventas] = await oltpDb.query('SELECT COUNT(*) as total FROM venta');
        const [detalleVenta] = await oltpDb.query('SELECT COUNT(*) as total FROM detalle_venta');
        
        console.log(`   Ventas (cabecera): ${ventas[0].total} registros`);
        console.log(`   Detalle Venta (líneas): ${detalleVenta[0].total} registros`);

        // Mostrar algunas ventas
        const [ventasDetalle] = await oltpDb.query(`
            SELECT 
                numero_venta,
                fecha_venta as fecha,
                total_venta as total,
                (SELECT COUNT(*) FROM detalle_venta WHERE numero_venta = v.numero_venta) as lineas
            FROM venta v
            ORDER BY fecha_venta DESC
            LIMIT 5
        `);
        
        console.log('\n   Últimas 5 ventas:');
        ventasDetalle.forEach(v => {
            console.log(`     - Venta #${v.numero_venta} (${v.fecha.toISOString().split('T')[0]}) - $${v.total} - ${v.lineas} líneas`);
        });

        // 2. Verificar registros en DW
        console.log('\n\n📊 DATA WAREHOUSE (tienda_cipa_dw):');
        console.log('-'.repeat(60));
        
        const [factVentas] = await dwDb.query('SELECT COUNT(*) as total FROM fact_ventas');
        
        console.log(`   fact_ventas (líneas de venta): ${factVentas[0].total} registros`);

        // Mostrar detalle de fact_ventas
        const [factVentasDetalle] = await dwDb.query(`
            SELECT 
                fv.numero_venta_original,
                dt.fecha,
                dp.nombre_producto,
                dc.nombre_cliente,
                fv.cantidad_vendida,
                fv.total_linea,
                fv.utilidad_linea
            FROM fact_ventas fv
            LEFT JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key
            LEFT JOIN dim_producto dp ON fv.producto_key = dp.producto_key
            LEFT JOIN dim_cliente dc ON fv.cliente_key = dc.cliente_key
            ORDER BY dt.fecha DESC
            LIMIT 10
        `);
        
        console.log('\n   Registros en fact_ventas:');
        factVentasDetalle.forEach(fv => {
            console.log(`     - Venta #${fv.numero_venta_original} | ${fv.fecha?.toISOString().split('T')[0] || 'N/A'} | ${fv.nombre_producto || 'N/A'} | Cliente: ${fv.nombre_cliente || 'N/A'} | Cant: ${fv.cantidad_vendida} | Total: $${fv.total_linea}`);
        });

        // Agregación por fecha para simular fact_ventas_diarias
        const [factDiariasAgregado] = await dwDb.query(`
            SELECT 
                dt.fecha,
                COUNT(DISTINCT fv.numero_venta_original) as cantidad_ventas,
                SUM(fv.total_linea) as total_ventas_dia,
                SUM(fv.utilidad_linea) as utilidad_total_dia,
                AVG(fv.margen_linea) as margen_promedio
            FROM fact_ventas fv
            LEFT JOIN dim_tiempo dt ON fv.tiempo_key = dt.tiempo_key
            GROUP BY dt.fecha
            ORDER BY dt.fecha DESC
        `);
        
        console.log(`\n   Agregación por día (ventas únicas): ${factDiariasAgregado.length} días con ventas`);
        console.log('\n   Resumen por fecha:');
        factDiariasAgregado.slice(0, 5).forEach(fvd => {
            console.log(`     - ${fvd.fecha?.toISOString().split('T')[0] || 'N/A'} | ${fvd.cantidad_ventas} ventas | Total: $${fvd.total_ventas_dia.toFixed(2)} | Utilidad: $${fvd.utilidad_total_dia.toFixed(2)} | Margen: ${fvd.margen_promedio?.toFixed(2) || 0}%`);
        });

        // 3. DIAGNÓSTICO
        console.log('\n\n🔍 DIAGNÓSTICO:');
        console.log('='.repeat(60));
        
        const detalleTotal = detalleVenta[0].total;
        const factTotal = factVentas[0].total;
        
        if (detalleTotal === factTotal) {
            console.log('✅ CORRECTO: fact_ventas tiene la misma cantidad de registros que detalle_venta');
        } else {
            console.log(`⚠️  INCONSISTENCIA DETECTADA:`);
            console.log(`   - detalle_venta (OLTP): ${detalleTotal} registros`);
            console.log(`   - fact_ventas (DW): ${factTotal} registros`);
            console.log(`   - DIFERENCIA: ${Math.abs(detalleTotal - factTotal)} registros`);
            
            if (factTotal < detalleTotal) {
                console.log('\n   💡 POSIBLE CAUSA: El ETL no se ha ejecutado o está incompleto');
                console.log('   📝 SOLUCIÓN: Ejecutar el proceso ETL completo:');
                console.log('      cd etl');
                console.log('      node etl-main.js');
            }
        }

        console.log('\n📌 NOTA IMPORTANTE:');
        console.log('   - fact_ventas debe tener 1 registro por cada línea de detalle_venta');
        console.log('   - fact_ventas almacena el detalle completo (granularidad por línea)');
        console.log('   - Los reportes agregan fact_ventas según necesidad (por día, mes, cliente, etc.)');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await oltpDb.end();
        await dwDb.end();
        console.log('\n' + '='.repeat(60));
    }
}

verificarInconsistencia();

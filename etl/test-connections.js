// ===============================================
// 🧪 SCRIPT DE PRUEBA DEL ETL
// Verifica conexiones y valida la estructura
// ===============================================

const DatabaseConnections = require('./utils/database-connections');
const { createETLLogger } = require('./utils/logger');

async function testETLSystem() {
    const logger = createETLLogger('TEST');
    logger.startProcess('Pruebas del sistema ETL');

    try {
        const db = new DatabaseConnections();
        
        // 1️⃣ Probar conexiones
        console.log('🧪 1. Probando conexiones...');
        const connectionResults = await db.testConnections();
        
        console.log('📊 OLTP Status:', connectionResults.oltp.status);
        if (connectionResults.oltp.status === 'connected') {
            console.log(`   ✅ Productos disponibles: ${connectionResults.oltp.products}`);
            console.log(`   ✅ Base de datos: ${connectionResults.oltp.database}`);
        } else {
            console.log(`   ❌ Error: ${connectionResults.oltp.error}`);
        }

        console.log('📊 DW Status:', connectionResults.dw.status);
        if (connectionResults.dw.status === 'connected') {
            console.log(`   ✅ Fechas en dim_tiempo: ${connectionResults.dw.time_records}`);
            console.log(`   ✅ Base de datos: ${connectionResults.dw.database}`);
        } else {
            console.log(`   ❌ Error: ${connectionResults.dw.error}`);
        }

        if (connectionResults.oltp.status !== 'connected' || connectionResults.dw.status !== 'connected') {
            throw new Error('No se pudieron establecer las conexiones necesarias');
        }

        // 2️⃣ Verificar estructura del DW
        console.log('\\n🏗️ 2. Verificando estructura del Data Warehouse...');
        await db.connectDW();
        
        const [tables] = await db.dwConnection.execute('SHOW TABLES');
        console.log('📋 Tablas encontradas:', tables.length);
        
        const expectedTables = [
            'dim_cliente', 'dim_medio_pago', 'dim_producto', 
            'dim_tiempo', 'dim_ubicacion', 'fact_ventas', 'fact_ventas_diario'
        ];

        const existingTables = tables.map(t => Object.values(t)[0]);
        
        expectedTables.forEach(table => {
            if (existingTables.includes(table)) {
                console.log(`   ✅ ${table}`);
            } else {
                console.log(`   ❌ ${table} - FALTANTE`);
            }
        });

        // 3️⃣ Verificar datos de muestra en OLTP
        console.log('\\n📊 3. Verificando datos en sistema operacional...');
        await db.connectOLTP();

        const checks = [
            { table: 'producto', description: 'Productos' },
            { table: 'cliente', description: 'Clientes' },
            { table: 'venta', description: 'Ventas' },
            { table: 'detalle_venta', description: 'Detalles de venta' },
            { table: 'municipio', description: 'Municipios' },
            { table: 'tipo_producto', description: 'Tipos de producto' },
            { table: 'unidad_medida', description: 'Unidades de medida' },
            { table: 'medio_pago', description: 'Medios de pago' }
        ];

        for (const check of checks) {
            try {
                const [count] = await db.oltpConnection.execute(`SELECT COUNT(*) as total FROM ${check.table}`);
                console.log(`   📈 ${check.description}: ${count[0].total} registros`);
            } catch (error) {
                console.log(`   ❌ ${check.description}: Error - ${error.message}`);
            }
        }

        // 4️⃣ Verificar integridad referencial
        console.log('\\n🔗 4. Verificando integridad referencial...');
        
        try {
            const [orphanProducts] = await db.oltpConnection.execute(`
                SELECT COUNT(*) as total 
                FROM producto p 
                LEFT JOIN tipo_producto tp ON p.id_tipo_producto = tp.id 
                WHERE tp.id IS NULL
            `);
            console.log(`   📦 Productos sin tipo: ${orphanProducts[0].total}`);

            const [orphanSales] = await db.oltpConnection.execute(`
                SELECT COUNT(*) as total 
                FROM venta v 
                LEFT JOIN cliente c ON v.id_cliente = c.id 
                WHERE c.id IS NULL
            `);
            console.log(`   💰 Ventas sin cliente: ${orphanSales[0].total}`);

            const [orphanDetails] = await db.oltpConnection.execute(`
                SELECT COUNT(*) as total 
                FROM detalle_venta dv 
                LEFT JOIN producto p ON dv.codigo_producto = p.codigo_producto 
                WHERE p.codigo_producto IS NULL
            `);
            console.log(`   📋 Detalles sin producto: ${orphanDetails[0].total}`);
        } catch (error) {
            console.log(`   ❌ Error verificando integridad: ${error.message}`);
        }

        // 5️⃣ Verificar rangos de fechas
        console.log('\\n📅 5. Verificando rangos de fechas...');
        
        try {
            const [dateRange] = await db.oltpConnection.execute(`
                SELECT 
                    MIN(fecha_venta) as primera_venta,
                    MAX(fecha_venta) as ultima_venta,
                    COUNT(*) as total_ventas
                FROM venta
            `);
            
            if (dateRange[0].primera_venta) {
                console.log(`   📅 Primera venta: ${dateRange[0].primera_venta}`);
                console.log(`   📅 Última venta: ${dateRange[0].ultima_venta}`);
                console.log(`   📈 Total ventas: ${dateRange[0].total_ventas}`);
            } else {
                console.log(`   ⚠️ No hay ventas registradas`);
            }

            // Verificar cobertura de dim_tiempo
            const [timeRange] = await db.dwConnection.execute(`
                SELECT 
                    MIN(fecha) as fecha_inicio,
                    MAX(fecha) as fecha_fin,
                    COUNT(*) as total_fechas
                FROM dim_tiempo
            `);
            
            console.log(`   🗓️ Cobertura DW: ${timeRange[0].fecha_inicio} a ${timeRange[0].fecha_fin} (${timeRange[0].total_fechas} fechas)`);
        } catch (error) {
            console.log(`   ❌ Error verificando fechas: ${error.message}`);
        }

        // 6️⃣ Generar estadísticas del DW actual
        console.log('\\n📊 6. Estado actual del Data Warehouse...');
        
        try {
            const dwStats = await db.getDatabaseStats();
            
            if (dwStats.dw) {
                dwStats.dw.forEach(table => {
                    console.log(`   📋 ${table.table_name}: ${table.table_rows || 0} filas`);
                });
            }
        } catch (error) {
            console.log(`   ❌ Error obteniendo estadísticas: ${error.message}`);
        }

        await db.closeAll();
        
        console.log('\\n🎉 ¡Pruebas completadas exitosamente!');
        console.log('\\n🚀 El sistema ETL está listo para ejecutarse.');
        console.log('\\n📋 Comandos disponibles:');
        console.log('   npm run etl:full        - ETL completo');
        console.log('   npm run etl:dimensions  - Solo dimensiones');
        console.log('   npm run etl:facts       - Solo hechos');
        
        logger.endProcess(true);
        return true;
    } catch (error) {
        console.error('\\n❌ Error en las pruebas:', error.message);
        logger.endProcess(false);
        return false;
    }
}

// Ejecutar pruebas si es llamado directamente
if (require.main === module) {
    testETLSystem().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testETLSystem };
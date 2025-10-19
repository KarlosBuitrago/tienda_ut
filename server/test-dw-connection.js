// ===============================================
// 🧪 SCRIPT DE PRUEBA - CONEXIÓN AL DW
// ===============================================

require('dotenv').config();
const dwDb = require('./db-dw');

console.log('🔍 Probando conexión al Data Warehouse...\n');

// Test 1: Verificar conexión básica
console.log('📊 Test 1: Verificar tablas del DW');
dwDb.query('SHOW TABLES', (err, results) => {
    if (err) {
        console.error('❌ Error al obtener tablas:', err.message);
        process.exit(1);
    }
    
    console.log('✅ Tablas encontradas:');
    results.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
    });
    console.log('');
    
    // Test 2: Contar registros en dimensiones
    console.log('📊 Test 2: Contar registros en dimensiones');
    
    const queries = [
        'SELECT COUNT(*) as total FROM dim_tiempo',
        'SELECT COUNT(*) as total FROM dim_producto',
        'SELECT COUNT(*) as total FROM dim_cliente',
        'SELECT COUNT(*) as total FROM dim_ubicacion',
        'SELECT COUNT(*) as total FROM dim_medio_pago',
        'SELECT COUNT(*) as total FROM fact_ventas'
    ];
    
    let completed = 0;
    
    queries.forEach((query, index) => {
        dwDb.query(query, (err, results) => {
            const tableName = query.match(/FROM (\w+)/)[1];
            
            if (err) {
                console.log(`   ❌ ${tableName}: Error - ${err.message}`);
            } else {
                console.log(`   ✅ ${tableName}: ${results[0].total} registros`);
            }
            
            completed++;
            
            if (completed === queries.length) {
                console.log('\n🎉 Prueba completada!');
                console.log('📝 Si ves 0 registros en fact_ventas, ejecuta el ETL:');
                console.log('   cd etl && npm run etl:full\n');
                process.exit(0);
            }
        });
    });
});

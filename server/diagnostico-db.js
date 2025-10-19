// Diagnóstico completo de conexiones
require('dotenv').config();
const mysql = require('mysql2/promise');

async function diagnostico() {
    console.log('🔍 DIAGNÓSTICO DE CONEXIONES\n');
    console.log('📋 Variables de entorno:');
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_USER: ${process.env.DB_USER}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME}`);
    console.log(`   DW_HOST: ${process.env.DW_HOST}`);
    console.log(`   DW_USER: ${process.env.DW_USER}`);
    console.log(`   DW_NAME: ${process.env.DW_NAME}\n`);

    // Probar OLTP
    console.log('1️⃣ Probando conexión OLTP...');
    try {
        const oltpConn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await oltpConn.execute('SELECT COUNT(*) as count FROM producto');
        console.log(`   ✅ OLTP conectado - ${rows[0].count} productos`);
        await oltpConn.end();
    } catch (error) {
        console.log(`   ❌ OLTP error: ${error.message}`);
        console.log(`   📍 Código: ${error.code}`);
    }

    // Probar DW
    console.log('\n2️⃣ Probando conexión DW...');
    try {
        const dwConn = await mysql.createConnection({
            host: process.env.DW_HOST,
            user: process.env.DW_USER,
            password: process.env.DW_PASSWORD,
            database: process.env.DW_NAME
        });

        const [rows] = await dwConn.execute('SELECT COUNT(*) as count FROM fact_ventas');
        console.log(`   ✅ DW conectado - ${rows[0].count} ventas`);
        await dwConn.end();
    } catch (error) {
        console.log(`   ❌ DW error: ${error.message}`);
        console.log(`   📍 Código: ${error.code}`);
    }

    // Verificar si MySQL está corriendo
    console.log('\n3️⃣ Verificando servidor MySQL...');
    try {
        const testConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD
        });

        const [rows] = await testConn.execute('SHOW DATABASES');
        console.log(`   ✅ MySQL corriendo - ${rows.length} bases de datos`);
        console.log(`   📊 Bases disponibles:`, rows.map(r => r.Database).join(', '));
        await testConn.end();
    } catch (error) {
        console.log(`   ❌ MySQL no accesible: ${error.message}`);
        console.log(`   💡 Solución: Verificar que MySQL/MariaDB esté corriendo`);
    }

    console.log('\n✅ Diagnóstico completado\n');
}

diagnostico();

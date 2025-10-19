const mysql = require('mysql2');
require('dotenv').config();

// Conexión al Data Warehouse
const dwConnection = mysql.createConnection({
    host: process.env.DW_HOST || process.env.DB_HOST,
    user: process.env.DW_USER || process.env.DB_USER,
    password: process.env.DW_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DW_NAME || 'tienda_cipa_dw'
});

dwConnection.connect((err) => {
    if (err) {
        console.error('❌ Error conectando al Data Warehouse:', err);
        console.error('⚠️ Los reportes BI no estarán disponibles');
        return;
    }
    console.log('✅ Conectado al Data Warehouse (tienda_cipa_dw)');
});

// Manejar errores de conexión
dwConnection.on('error', (err) => {
    console.error('❌ Error en conexión DW:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Intentando reconectar al DW...');
    }
});

module.exports = dwConnection;

const mysql = require('mysql2');
require('dotenv').config();

const conn = mysql.createConnection({
    host: process.env.DW_HOST || 'localhost',
    user: process.env.DW_USER || 'root',
    password: process.env.DW_PASSWORD,
    database: process.env.DW_NAME || 'tienda_cipa_dw'
});

conn.connect((err) => {
    if (err) {
        console.error('Error conectando:', err);
        return;
    }
    
    console.log('✅ Conectado a DW\n');
    
    const query = `
        SELECT 
            codigo_producto,
            nombre_producto,
            tipo_producto,
            stock_actual,
            producto_key,
            (producto_key % 60) as dias_restantes,
            DATE_ADD(CURDATE(), INTERVAL (producto_key % 60) DAY) as fecha_vencimiento
        FROM dim_producto 
        WHERE stock_actual > 0
          AND tipo_producto IN ('Bebidas', 'Alimentos procesados', 'Lácteos y huevos', 'Carnes frías', 'Frutas y verduras', 'Panadería')
          AND (producto_key % 60) <= 30
        ORDER BY dias_restantes ASC
        LIMIT 10
    `;
    
    conn.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error:', err);
        } else {
            console.log(`📦 Encontrados ${results.length} productos próximos a vencer:\n`);
            console.table(results);
        }
        conn.end();
    });
});

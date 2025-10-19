// Script Node.js para agregar índices ignorando duplicados
require('dotenv').config();
const mysql = require('mysql2/promise');

async function agregarIndices() {
    let conn;
    
    try {
        console.log('🔌 Conectando al DW...');
        conn = await mysql.createConnection({
            host: process.env.DW_HOST,
            user: process.env.DW_USER,
            password: process.env.DW_PASSWORD,
            database: process.env.DW_NAME
        });

        console.log('✅ Conectado\n');

        const indices = [
            { tabla: 'dim_producto', nombre: 'idx_codigo_producto', columnas: 'codigo_producto', unique: true },
            { tabla: 'dim_cliente', nombre: 'idx_id_cliente_original', columnas: 'id_cliente_original', unique: true },
            { tabla: 'dim_ubicacion', nombre: 'idx_id_municipio_original', columnas: 'id_municipio_original', unique: true },
            { tabla: 'dim_medio_pago', nombre: 'idx_id_medio_pago_original', columnas: 'id_medio_pago_original', unique: true },
            { tabla: 'dim_tiempo', nombre: 'idx_fecha', columnas: 'fecha', unique: true },
            { tabla: 'fact_ventas', nombre: 'idx_venta_producto', columnas: 'numero_venta_original, codigo_producto_original', unique: true },
            { tabla: 'fact_ventas', nombre: 'idx_tiempo', columnas: 'tiempo_key', unique: false },
            { tabla: 'fact_ventas', nombre: 'idx_producto', columnas: 'producto_key', unique: false },
            { tabla: 'fact_ventas', nombre: 'idx_cliente', columnas: 'cliente_key', unique: false },
            { tabla: 'fact_ventas', nombre: 'idx_ubicacion', columnas: 'ubicacion_key', unique: false },
            { tabla: 'fact_ventas', nombre: 'idx_fecha_venta', columnas: 'fecha_venta_original', unique: false }
        ];

        for (const idx of indices) {
            try {
                const tipo = idx.unique ? 'UNIQUE INDEX' : 'INDEX';
                const sql = `ALTER TABLE ${idx.tabla} ADD ${tipo} ${idx.nombre} (${idx.columnas})`;
                
                await conn.query(sql);
                console.log(`✅ ${idx.nombre} creado en ${idx.tabla}`);
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log(`⚠️ ${idx.nombre} ya existe en ${idx.tabla}`);
                } else {
                    console.error(`❌ Error creando ${idx.nombre}:`, error.message);
                }
            }
        }

        console.log('\n✅ Proceso completado');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

agregarIndices();

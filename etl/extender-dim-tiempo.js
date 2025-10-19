// Script para extender dim_tiempo con más fechas
require('dotenv').config();
const mysql = require('mysql2/promise');

async function extenderDimTiempo() {
    let dwConn;

    try {
        console.log('🔌 Conectando al DW...');
        dwConn = await mysql.createConnection({
            host: process.env.DW_HOST || 'localhost',
            user: process.env.DW_USER || 'root',
            password: process.env.DW_PASSWORD,
            database: process.env.DW_NAME || 'tienda_cipa_dw'
        });

        console.log('✅ Conectado\n');

        // Ver rango actual
        const [rango] = await dwConn.execute(`
            SELECT MIN(fecha) as primera, MAX(fecha) as ultima, COUNT(*) as total 
            FROM dim_tiempo
        `);
        console.log('📅 Rango actual en dim_tiempo:');
        console.log(`   Primera fecha: ${rango[0].primera}`);
        console.log(`   Última fecha: ${rango[0].ultima}`);
        console.log(`   Total registros: ${rango[0].total}\n`);

        // Agregar fechas desde agosto 2025 hasta diciembre 2025
        console.log('➕ Agregando fechas desde 2025-08-01 hasta 2025-12-31...\n');

        const fechaInicio = new Date('2025-08-01');
        const fechaFin = new Date('2025-12-31');
        let contador = 0;

        for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
            const fecha = new Date(d);
            const año = fecha.getFullYear();
            const mes = fecha.getMonth() + 1;
            const dia = fecha.getDate();
            const diaSemana = fecha.getDay();
            
            const nombresMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const nombresDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            
            const mesNombre = nombresMes[mes - 1];
            const diaNombre = nombresDia[diaSemana];
            const trimestre = Math.ceil(mes / 3);
            const esFinde = diaSemana === 0 || diaSemana === 6;

            // Verificar si ya existe
            const [existe] = await dwConn.execute(
                'SELECT tiempo_key FROM dim_tiempo WHERE fecha = ?',
                [fecha.toISOString().split('T')[0]]
            );

            if (existe.length === 0) {
                await dwConn.execute(`
                    INSERT INTO dim_tiempo (
                        fecha, año, mes, dia, dia_semana, mes_nombre, dia_semana_nombre, trimestre, es_fin_semana
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [fecha.toISOString().split('T')[0], año, mes, dia, diaSemana, mesNombre, diaNombre, trimestre, esFinde]);
                
                contador++;
                if (contador % 30 === 0) {
                    console.log(`   ✓ Insertadas ${contador} fechas...`);
                }
            }
        }

        console.log(`\n✅ Total agregadas: ${contador} nuevas fechas\n`);

        // Ver nuevo rango
        const [nuevoRango] = await dwConn.execute(`
            SELECT MIN(fecha) as primera, MAX(fecha) as ultima, COUNT(*) as total 
            FROM dim_tiempo
        `);
        console.log('📅 Nuevo rango en dim_tiempo:');
        console.log(`   Primera fecha: ${nuevoRango[0].primera}`);
        console.log(`   Última fecha: ${nuevoRango[0].ultima}`);
        console.log(`   Total registros: ${nuevoRango[0].total}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (dwConn) await dwConn.end();
        console.log('\n🚪 Conexión cerrada');
    }
}

extenderDimTiempo();

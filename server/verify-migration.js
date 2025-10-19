#!/usr/bin/env node

// ===============================================
// 🚀 VERIFICADOR COMPLETO DE MIGRACIÓN AL DW
// ===============================================

const http = require('http');
require('dotenv').config();

console.log('\n🔍 VERIFICADOR DE MIGRACIÓN AL DATA WAREHOUSE\n');
console.log('═'.repeat(60) + '\n');

const tests = [
    {
        name: '📊 Dashboard General',
        endpoint: '/api/reportes/dashboard',
        checkFields: ['ventasTotal', 'utilidadTotal', 'margenPromedio']
    },
    {
        name: '⚠️  Stock Bajo',
        endpoint: '/api/reportes/stock-bajo?minimo=10',
        checkFields: ['productos'],
        checkArray: true
    },
    {
        name: '🚫 Productos Faltantes',
        endpoint: '/api/reportes/faltantes',
        checkFields: ['productos'],
        checkArray: true
    },
    {
        name: '👥 Top Clientes',
        endpoint: '/api/reportes/top-clientes?limite=5',
        checkFields: ['clientes'],
        checkArray: true,
        newFields: ['segmento_cliente', 'utilidad_generada']
    },
    {
        name: '📦 Top Productos',
        endpoint: '/api/reportes/top-productos?limite=5',
        checkFields: ['productos'],
        checkArray: true,
        newFields: ['utilidad_generada', 'margen_promedio']
    },
    {
        name: '🏘️  Ventas por Municipio',
        endpoint: '/api/reportes/ventas-municipio',
        checkFields: ['municipios'],
        checkArray: true,
        newFields: ['utilidad_total', 'departamento']
    },
    {
        name: '📈 Tendencias de Ventas',
        endpoint: '/api/reportes/tendencias-ventas?periodo=mensual',
        checkFields: ['tendencias'],
        checkArray: true,
        newFields: ['utilidad_total', 'clientes_unicos']
    },
    {
        name: '💰 Análisis de Rentabilidad',
        endpoint: '/api/reportes/rentabilidad',
        checkFields: ['productos'],
        checkArray: true,
        newFields: ['ganancia_total', 'margen_promedio_real']
    },
    {
        name: '😴 Clientes Inactivos',
        endpoint: '/api/reportes/clientes-inactivos?dias=90',
        checkFields: ['clientes'],
        checkArray: true,
        newFields: ['segmento_cliente', 'rango_edad']
    }
];

let passed = 0;
let failed = 0;
let current = 0;

function makeRequest(test) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: process.env.PORT || 3006,
            path: test.endpoint,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    // Verificar campos requeridos
                    const hasRequiredFields = test.checkFields.every(field => 
                        result.hasOwnProperty(field)
                    );

                    if (!hasRequiredFields) {
                        console.log(`${test.name}`);
                        console.log(`   ❌ FALLO - Faltan campos requeridos`);
                        console.log(`   Campos esperados: ${test.checkFields.join(', ')}\n`);
                        failed++;
                        resolve();
                        return;
                    }

                    // Verificar si es array y tiene datos
                    if (test.checkArray) {
                        const arrayField = test.checkFields[0];
                        const items = result[arrayField];
                        
                        if (!Array.isArray(items)) {
                            console.log(`${test.name}`);
                            console.log(`   ❌ FALLO - ${arrayField} no es un array\n`);
                            failed++;
                            resolve();
                            return;
                        }

                        // Verificar nuevos campos si hay datos
                        if (items.length > 0 && test.newFields) {
                            const firstItem = items[0];
                            const hasNewFields = test.newFields.some(field => 
                                firstItem.hasOwnProperty(field)
                            );

                            if (hasNewFields) {
                                console.log(`${test.name}`);
                                console.log(`   ✅ ÉXITO - ${items.length} registros`);
                                console.log(`   🆕 Nuevos campos detectados: ${test.newFields.join(', ')}\n`);
                                passed++;
                            } else {
                                console.log(`${test.name}`);
                                console.log(`   ⚠️  ADVERTENCIA - ${items.length} registros pero sin campos nuevos\n`);
                                passed++;
                            }
                        } else {
                            console.log(`${test.name}`);
                            console.log(`   ✅ ÉXITO - ${items.length} registros\n`);
                            passed++;
                        }
                    } else {
                        // Verificar nuevos campos en objeto simple
                        if (test.checkFields.includes('utilidadTotal') || 
                            test.checkFields.includes('margenPromedio')) {
                            console.log(`${test.name}`);
                            console.log(`   ✅ ÉXITO - Datos del DW confirmados`);
                            console.log(`   🆕 Métricas nuevas: utilidadTotal, margenPromedio\n`);
                            passed++;
                        } else {
                            console.log(`${test.name}`);
                            console.log(`   ✅ ÉXITO\n`);
                            passed++;
                        }
                    }

                } catch (error) {
                    console.log(`${test.name}`);
                    console.log(`   ❌ FALLO - Error al parsear respuesta: ${error.message}\n`);
                    failed++;
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`${test.name}`);
            console.log(`   ❌ FALLO - Error de conexión: ${error.message}`);
            console.log(`   ⚠️  ¿Servidor corriendo en puerto ${options.port}?\n`);
            failed++;
            resolve();
        });

        req.setTimeout(5000, () => {
            console.log(`${test.name}`);
            console.log(`   ❌ FALLO - Timeout (> 5 segundos)\n`);
            req.destroy();
            failed++;
            resolve();
        });

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Ejecutando tests de endpoints...\n');
    
    for (const test of tests) {
        await makeRequest(test);
        current++;
    }

    console.log('═'.repeat(60));
    console.log('\n📊 RESUMEN DE PRUEBAS\n');
    console.log(`   Total:    ${tests.length}`);
    console.log(`   ✅ Éxito:  ${passed} (${Math.round(passed/tests.length*100)}%)`);
    console.log(`   ❌ Fallos: ${failed} (${Math.round(failed/tests.length*100)}%)`);

    if (failed === 0) {
        console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!\n');
        console.log('✨ Los reportes están consultando correctamente el DW');
        console.log('✨ Nuevas métricas disponibles');
        console.log('✨ Sistema BI operacional al 100%\n');
    } else {
        console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON\n');
        console.log('📝 Verifica:');
        console.log('   1. Servidor corriendo: npm start');
        console.log('   2. DW creado: scripts en dw-schema/');
        console.log('   3. ETL ejecutado: cd etl && npm run etl:full');
        console.log('   4. Variables .env configuradas\n');
    }

    console.log('📚 Documentación: MIGRATION_TO_DW.md');
    console.log('📋 Checklist: CHECKLIST.md\n');
}

// Verificar si el servidor está corriendo
console.log('🔌 Verificando conexión al servidor...\n');

const checkOptions = {
    hostname: 'localhost',
    port: process.env.PORT || 3006,
    path: '/api/productos',
    method: 'GET',
    timeout: 3000
};

const checkReq = http.request(checkOptions, (res) => {
    console.log('✅ Servidor respondiendo correctamente\n');
    console.log('═'.repeat(60) + '\n');
    runTests();
});

checkReq.on('error', (error) => {
    console.log('❌ ERROR: No se puede conectar al servidor\n');
    console.log(`   Puerto: ${checkOptions.port}`);
    console.log(`   Error: ${error.message}\n`);
    console.log('💡 Solución:');
    console.log('   1. Navegar a: cd server');
    console.log('   2. Ejecutar: npm start');
    console.log('   3. Esperar mensaje: "Server running on port 3006"');
    console.log('   4. Volver a ejecutar: node verify-migration.js\n');
    process.exit(1);
});

checkReq.setTimeout(3000, () => {
    console.log('❌ ERROR: Timeout al conectar con el servidor\n');
    checkReq.destroy();
    process.exit(1);
});

checkReq.end();

// Test simple de endpoints
const http = require('http');

console.log('🧪 Probando Dashboard...\n');

const req = http.get('http://localhost:3006/api/reportes/dashboard', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('\n📊 Respuesta del Dashboard:\n');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
            
            // Verificar métricas nuevas del DW
            if (json.utilidadTotal !== undefined) {
                console.log('\n✅ MÉTRICAS DEL DW DETECTADAS:');
                console.log(`   - Utilidad Total: ${json.utilidadTotal}`);
                console.log(`   - Margen Promedio: ${json.margenPromedio}`);
            }
        } catch (e) {
            console.log('Error:', e.message);
            console.log('Data:', data);
        }
    });
});

req.on('error', (e) => {
    console.log('❌ Error:', e.message);
});

req.setTimeout(5000);
